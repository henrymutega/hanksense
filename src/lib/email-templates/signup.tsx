import * as React from 'react'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  token: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  token,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {token} is your {siteName} verification code
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verify your email</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Enter this code on the sign-up page to finish creating your account
          for{' '}
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          .
        </Text>
        <Section style={codeBox}>
          <Text style={code}>{token}</Text>
        </Section>
        <Text style={text}>This code expires in 60 minutes.</Text>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#0b1220',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 20px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const codeBox = {
  backgroundColor: '#f3f6fc',
  border: '1px solid #dbe4f5',
  borderRadius: '10px',
  padding: '18px 0',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}
const code = {
  fontSize: '30px',
  fontWeight: 'bold' as const,
  letterSpacing: '10px',
  color: '#1d4ed8',
  margin: '0',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
