import type { Metadata } from "next";
import { AuthorizeAgent } from "@/components/authorize-agent";
import { approvalStatement, parseAuthorizeRequest, redirectWith } from "@/lib/oauth";

export const metadata: Metadata = { title: "Connect agent" };

export default async function AuthorizePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const authorize = await parseAuthorizeRequest(params);

  if (!authorize.ok) {
    return (
      <section className="grid min-h-[calc(100svh-230px)] place-items-center px-6 py-16 text-center">
        <div className="grid max-w-md gap-2">
          <h1 className="text-[24px] tracking-[-.02em]">Can&apos;t connect this agent</h1>
          <p className="text-subtle">{authorize.error}</p>
        </div>
      </section>
    );
  }

  const { client, request } = authorize;
  return (
    <AuthorizeAgent
      clientName={client.name}
      redirectHost={new URL(request.redirect_uri).host}
      statement={approvalStatement(client.name, request.redirect_uri)}
      denyUrl={redirectWith(request.redirect_uri, { error: "access_denied", state: request.state })}
      params={params}
    />
  );
}
