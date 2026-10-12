import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface RecoveryEmailProps {
  siteName: string
  token: string
}

export const RecoveryEmail = ({ siteName, token }: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{token} — {siteName} password reset code / 密码重置验证码</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset your password</Heading>
        <Heading style={h1zh}>重置密码</Heading>
        <Text style={text}>
          We received a request to reset your password for {siteName}. Copy
          this code and paste it on the reset password page.
        </Text>
        <Text style={text}>
          我们收到了重置您 {siteName} 账户密码的请求。请复制下方验证码，并粘贴到重置密码页面。
        </Text>
        <Section style={codeBox}>
          <Text style={code}>{token}</Text>
        </Section>
        <Text style={text}>
          This code expires in 60 minutes. · 验证码有效期为 60 分钟。
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this
          email. Your password will not be changed.
        </Text>
        <Text style={footer}>
          如非本人操作，请忽略此邮件，您的密码不会被修改。
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, "PingFang SC", "Microsoft YaHei", sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0b1220', margin: '0 0 4px' }
const h1zh = { fontSize: '18px', fontWeight: 'bold' as const, color: '#0b1220', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const codeBox = {
  backgroundColor: '#f3f6fc',
  border: '1px solid #dbe4f5',
  borderRadius: '10px',
  padding: '18px 0',
  textAlign: 'center' as const,
  margin: '8px 0 24px',
}
const code = { fontSize: '30px', fontWeight: 'bold' as const, letterSpacing: '10px', color: '#1d4ed8', margin: '0' }
const hr = { borderColor: '#eeeeee', margin: '24px 0 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '12px 0 0' }
