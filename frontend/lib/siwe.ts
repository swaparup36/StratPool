// A signature is only accepted for our own domain, so one collected by a phishing site can't sign in here.
// Never read this from request headers, which the sender controls. Development also runs on localhost next to a tunnel.
export function isAppDomain(domain: string | undefined, appDomain = process.env.APP_DOMAIN, nodeEnv = process.env.NODE_ENV): domain is string {
  if (!domain) return false;
  return domain === appDomain || (nodeEnv !== "production" && /^localhost(:\d+)?$/.test(domain));
}

export const wrongDomainError = () => `Open StratPool at ${process.env.APP_DOMAIN} and try again`;
