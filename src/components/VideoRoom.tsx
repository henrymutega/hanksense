import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Video, VideoOff, Mic, MicOff, PhoneOff, MonitorUp, MonitorX, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type Props = {
  roomId: string;
  displayName: string;
  remoteLabel: string;
  recording?: boolean;
  onJoined?: () => void;
  onLeft?: () => void;
};

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type SignalEvent =
  | { kind: "hello"; from: string }
  | { kind: "offer"; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { kind: "answer"; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { kind: "ice"; from: string; to: string; candidate: RTCIceCandidateInit }
  | { kind: "bye"; from: string };

export function VideoRoom({ roomId, displayName, remoteLabel, recording, onJoined, onLeft }: Props) {
  const { t: tr } = useTranslation();
  const [inCall, setInCall] = useState(false);
  const [joining, setJoining] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [remoteName, setRemoteName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const selfIdRef = useRef<string>(`peer-${Math.random().toString(36).slice(2, 10)}`);
  const peerIdRef = useRef<string | null>(null);
  const politeRef = useRef<boolean>(false);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);

  const send = useCallback((payload: SignalEvent) => {
    channelRef.current?.send({ type: "broadcast", event: "signal", payload });
  }, []);

  const cleanup = useCallback(() => {
    try { send({ kind: "bye", from: selfIdRef.current }); } catch { /* noop */ }
    pcRef.current?.getSenders().forEach(s => { try { s.track?.stop(); } catch { /* noop */ } });
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    cameraTrackRef.current = null;
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    peerIdRef.current = null;
    setRemoteConnected(false);
    setRemoteName(null);
    setSharing(false);
    setInCall(false);
    onLeft?.();
  }, [send, onLeft]);

  const createPeer = useCallback((peerId: string, polite: boolean) => {
    politeRef.current = polite;
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pcRef.current = pc;

    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (remoteVideoRef.current && stream) {
        remoteVideoRef.current.srcObject = stream;
      }
      setRemoteConnected(true);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        send({ kind: "ice", from: selfIdRef.current, to: peerId, candidate: e.candidate.toJSON() });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected" || pc.connectionState === "closed") {
        setRemoteConnected(false);
      }
    };

    pc.onnegotiationneeded = async () => {
      try {
        makingOfferRef.current = true;
        await pc.setLocalDescription();
        if (pc.localDescription) {
          send({ kind: "offer", from: selfIdRef.current, to: peerId, sdp: pc.localDescription });
        }
      } catch (err) {
        console.error("[room] negotiation error", err);
      } finally {
        makingOfferRef.current = false;
      }
    };

    return pc;
  }, [send]);

  const handleSignal = useCallback(async (payload: SignalEvent) => {
    if (payload.from === selfIdRef.current) return;

    if (payload.kind === "hello") {
      // Someone else joined. We become impolite (existing peer), they polite.
      peerIdRef.current = payload.from;
      setRemoteName(payload.from);
      if (!pcRef.current) createPeer(payload.from, false);
      // Greet back so the newcomer learns our id
      send({ kind: "hello", from: selfIdRef.current });
      return;
    }

    if (payload.kind === "bye") {
      if (peerIdRef.current === payload.from) {
        setRemoteConnected(false);
        setRemoteName(null);
        peerIdRef.current = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        // Close the PC so a fresh negotiation can happen if peer rejoins
        pcRef.current?.close();
        pcRef.current = null;
      }
      return;
    }

    if (!("to" in payload) || payload.to !== selfIdRef.current) return;

    if (!pcRef.current) {
      peerIdRef.current = payload.from;
      createPeer(payload.from, true);
    }
    const pc = pcRef.current!;

    try {
      if (payload.kind === "offer") {
        const offerCollision = makingOfferRef.current || pc.signalingState !== "stable";
        ignoreOfferRef.current = !politeRef.current && offerCollision;
        if (ignoreOfferRef.current) return;
        await pc.setRemoteDescription(payload.sdp);
        await pc.setLocalDescription();
        if (pc.localDescription) {
          send({ kind: "answer", from: selfIdRef.current, to: payload.from, sdp: pc.localDescription });
        }
      } else if (payload.kind === "answer") {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(payload.sdp);
        }
      } else if (payload.kind === "ice") {
        try {
          await pc.addIceCandidate(payload.candidate);
        } catch (err) {
          if (!ignoreOfferRef.current) console.warn("[room] ice add failed", err);
        }
      }
    } catch (err) {
      console.error("[room] signal handling error", err);
    }
  }, [createPeer, send]);

  const join = useCallback(async () => {
    setError(null);
    setJoining(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.current = stream;
      cameraTrackRef.current = stream.getVideoTracks()[0] || null;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const channel = supabase.channel(`room:${roomId}`, {
        config: { broadcast: { self: false, ack: false } },
      });
      channelRef.current = channel;

      channel.on("broadcast", { event: "signal" }, ({ payload }) => {
        handleSignal(payload as SignalEvent);
      });

      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("Signaling timeout")), 8000);
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") { clearTimeout(t); resolve(); }
          else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") { clearTimeout(t); reject(new Error(status)); }
        });
      });

      send({ kind: "hello", from: selfIdRef.current });
      setInCall(true);
      onJoined?.();
      toast.success(tr("videoRoom.joined"), { description: tr("videoRoom.joinedDesc") });
    } catch (err) {
      const msg = err instanceof Error ? err.message : tr("videoRoom.unableMedia");
      setError(msg);
      toast.error(tr("videoRoom.joinFail"), { description: msg });
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    } finally {
      setJoining(false);
    }
  }, [roomId, handleSignal, send, onJoined]);

  useEffect(() => () => cleanup(), [cleanup]);

  function toggleMic() {
    const next = !micOn;
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = next; });
    setMicOn(next);
  }

  function toggleCam() {
    const next = !camOn;
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = next; });
    setCamOn(next);
  }

  async function toggleShare() {
    const pc = pcRef.current;
    if (sharing) {
      // Restore camera
      const camTrack = cameraTrackRef.current;
      if (camTrack && pc) {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        await sender?.replaceTrack(camTrack);
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
      }
      setSharing(false);
      return;
    }
    try {
      const display = await (navigator.mediaDevices as MediaDevices & {
        getDisplayMedia: (c?: DisplayMediaStreamOptions) => Promise<MediaStream>;
      }).getDisplayMedia({ video: true, audio: false });
      const screenTrack = display.getVideoTracks()[0];
      if (!screenTrack) return;
      const sender = pc?.getSenders().find(s => s.track?.kind === "video");
      await sender?.replaceTrack(screenTrack);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = display;
      }
      screenTrack.onended = () => { toggleShare(); };
      setSharing(true);
    } catch (err) {
      toast.error(tr("videoRoom.shareCancelled"));
    }
  }

  function copyLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    toast.success(tr("videoRoom.linkCopied"));
  }

  const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const remoteInitials = remoteLabel.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-black aspect-video relative">
        {/* Remote tile */}
        <div className="bg-black relative grid place-items-center text-white/60 text-xs min-h-[160px]">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${remoteConnected ? "" : "hidden"}`}
          />
          {!remoteConnected && (
            <div className="text-center px-4">
              <div className="w-16 h-16 rounded-full bg-zinc-700 grid place-items-center text-white text-xl mx-auto mb-2">
                {remoteInitials}
              </div>
              <div className="text-white/70 text-sm">{remoteLabel}</div>
              <div className="text-white/40 text-[10px] mt-1">
                {inCall ? (peerIdRef.current ? tr("videoRoom.connectingRemote") : tr("videoRoom.waiting")) : tr("videoRoom.notStarted")}
              </div>
            </div>
          )}
          <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">
            {remoteLabel}
          </span>
        </div>

        {/* Local tile */}
        <div className="bg-zinc-900 relative grid place-items-center text-white/60 text-xs min-h-[160px]">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${inCall && camOn ? "" : "hidden"}`}
          />
          {(!inCall || !camOn) && (
            <div className="text-center px-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 grid place-items-center text-white text-xl mx-auto mb-2">
                {initials}
              </div>
              <div className="text-white/70 text-sm">{displayName} {tr("videoRoom.you")}</div>
              <div className="text-white/40 text-[10px] mt-1">
                {inCall ? (camOn ? tr("videoRoom.live") : tr("videoRoom.camOffLabel")) : tr("videoRoom.notJoined")}
              </div>
            </div>
          )}
          <span className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">
            {displayName} {!micOn && `· ${tr("videoRoom.muted")}`} {sharing && `· ${tr("videoRoom.sharing")}`}
          </span>
        </div>

        {recording && inCall && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] bg-destructive/80 text-white px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {tr("videoRoom.rec")}
          </span>
        )}
        {inCall && (
          <span className="absolute top-3 right-3 text-[10px] bg-black/60 text-white/80 px-2 py-1 rounded-full">
            {tr("videoRoom.room", { id: roomId.slice(-6) })}
          </span>
        )}
      </div>

      <div className="p-3 flex flex-wrap items-center justify-center gap-2 bg-card">
        {!inCall ? (
          <>
            <button onClick={join} disabled={joining}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm inline-flex items-center gap-1.5 disabled:opacity-60">
              {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              {joining ? tr("videoRoom.connecting") : tr("videoRoom.joinMeeting")}
            </button>
            <button onClick={copyLink}
              className="border border-border px-3 py-2 rounded-md text-sm inline-flex items-center gap-1.5 hover:bg-accent">
              <Copy className="w-4 h-4" /> {tr("videoRoom.copyLink")}
            </button>
          </>
        ) : (
          <>
            <button onClick={toggleMic}
              className={`border px-3 py-2 rounded-md text-sm inline-flex items-center gap-1.5 ${micOn ? "border-border hover:bg-accent" : "border-destructive text-destructive bg-destructive/10"}`}>
              {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {micOn ? tr("videoRoom.micOn") : tr("videoRoom.micOff")}
            </button>
            <button onClick={toggleCam}
              className={`border px-3 py-2 rounded-md text-sm inline-flex items-center gap-1.5 ${camOn ? "border-border hover:bg-accent" : "border-destructive text-destructive bg-destructive/10"}`}>
              {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              {camOn ? tr("videoRoom.camOn") : tr("videoRoom.camOff")}
            </button>
            <button onClick={toggleShare}
              className={`border px-3 py-2 rounded-md text-sm inline-flex items-center gap-1.5 ${sharing ? "border-primary text-primary bg-primary/10" : "border-border hover:bg-accent"}`}>
              {sharing ? <MonitorX className="w-4 h-4" /> : <MonitorUp className="w-4 h-4" />}
              {sharing ? tr("videoRoom.stopShare") : tr("videoRoom.startShare")}
            </button>
            <button onClick={copyLink}
              className="border border-border px-3 py-2 rounded-md text-sm inline-flex items-center gap-1.5 hover:bg-accent">
              <Copy className="w-4 h-4" /> {tr("videoRoom.copyLink")}
            </button>
            <button onClick={cleanup}
              className="bg-destructive text-destructive-foreground px-3 py-2 rounded-md text-sm inline-flex items-center gap-1.5">
              <PhoneOff className="w-4 h-4" /> {tr("videoRoom.end")}
            </button>
          </>
        )}
      </div>
      {error && (
        <div className="px-4 pb-3 text-xs text-destructive">
          {error}.
        </div>
      )}
    </div>
  );
}
