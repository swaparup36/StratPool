import { InvestLink } from "@/components/invest-link";
import { MatchMock, OutcomeMock, PublishMock, StrategyViewMock, VaultMock } from "@/components/mocks";
import { PublishLink } from "@/components/publish-link";
import { CtaCenter, Faq, FeatureCards, FeatureRow, PlainColumns } from "@/components/sections";
import { buttonClass, SectionHead } from "@/components/ui";

const heroRule = "before:absolute before:left-1/2 before:w-screen before:-translate-x-1/2 before:border-t";
const heroAction = "grid h-14 place-items-center transition-colors";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-[260px] after:bg-radial-[50%_100%_at_50%_100%] after:from-accent/28 after:to-transparent">
        <div className="relative z-1 mx-auto max-w-[1200px] border-x text-center">
          <div className={`relative pt-9 before:top-20 ${heroRule}`}>
            <div className="relative inline-flex h-11 items-center gap-2 border bg-surface px-[18px] text-[13px] text-subtle">
              The DeFi strategy marketplace
            </div>
          </div>
          <div className="px-6 pt-12 pb-14">
            <h1 className="mx-auto max-w-[960px] bg-linear-[100deg,var(--text-3)_0%,var(--text-1)_48%] bg-clip-text text-[clamp(32px,7vw,64px)] leading-none tracking-[-.034em] text-transparent">
              Where Trading Intelligence Meets Investment Capital
            </h1>
            <p className="mx-auto mt-4 max-w-[680px] text-[clamp(16px,2vw,18px)] text-subtle">
              Strategists publish trading strategies. Investors set their requirements. StratPool matches the two and
              automates execution on deposited funds.
            </p>
          </div>
          <div className={`relative pb-21 before:top-0 ${heroRule}`}>
            <div className="relative mx-auto grid max-w-[392px] border-x">
              <PublishLink className={`${heroAction} bg-surface hover:bg-surface-2`} />
              <InvestLink className={`${heroAction} bg-accent text-on-accent hover:bg-accent-hover`} />
            </div>
          </div>
        </div>
      </section>

      <section className="page-container section-y" id="how-it-works">
        <SectionHead
          tag="How it works"
          title="From Requirements to Automated Execution"
          text="One marketplace, three steps, and a clear role for everyone involved."
        />
        <PlainColumns
          items={[
            ["layers", "Strategists publish", "Define the chain, trading pair, pool and accepted assets. Every strategy is validated when it is created."],
            ["target", "Investors get matched", "Set your chain, trading type, exact pair and risk. The matching engine finds the best available strategy."],
            ["zap", "Chainlink automates", "Triggers are set up to execute the matched strategy on the funds in your vault."],
          ]}
        />
        <MatchMock />
      </section>

      <section className="page-container section-b scroll-mt-24" id="strategists">
        <SectionHead
          tag="For strategists"
          title="Turn Your Trading Edge Into Income"
          text="Publish what you know, keep how it works to yourself, and earn when it performs."
        />
        <div className="grid gap-6">
          <FeatureRow
            title="Publish Once, Reach Every Matching Investor"
            text="Describe where your strategy runs and what it accepts. The matching engine puts it in front of investors looking for exactly that."
            list={[
              "Validated automatically on creation",
              "Exact duplicates are rejected",
              "Reuse your logic across other pairs and pools",
            ]}
          >
            <PublishMock />
          </FeatureRow>
          <FeatureRow
            title="Paid for Performance"
            text="You earn commission on every profitable trade that uses your strategy, and each one lifts its rating. Loss-making strategies lose rating and earn nothing."
            list={["Commission tracked through escrow contracts", "Ratings that reflect real results"]}
            flip
          >
            <OutcomeMock />
          </FeatureRow>
        </div>
      </section>

      <section className="page-container section-b scroll-mt-24" id="investors">
        <SectionHead
          tag="For investors"
          title="Put Capital Behind a Strategy That Fits"
          text="Say what you want to trade and let the matching engine find the strategy that fits."
        />
        <div className="grid gap-6">
          <FeatureRow
            title="Deposit Into a Vault, on the Right Chain"
            text="Your funds sit in a vault contract, and the strategy runs on them automatically. If your asset is not compatible with the strategy, we ask you to bridge it to the right chain first."
            list={["Choose your preferred chain and exact pair", "Compatibility checked before you commit"]}
          >
            <VaultMock />
          </FeatureRow>
          <FeatureRow
            title="See the Results, Not the Recipe"
            text="Every strategy shows its description, rating and relevant metrics, so you can judge it for yourself. Its internal logic stays private to protect the strategist who built it."
            flip
          >
            <StrategyViewMock />
          </FeatureRow>
        </div>
      </section>

      <section className="page-container section-b">
        <SectionHead
          tag="Under the hood"
          title="Incentives Both Sides Can Trust"
          text="The rules are the same for everyone, and strategists only win when investors do."
        />
        <FeatureCards
          items={[
            ["check", "Strategy Validation", "Each new strategy is checked at creation, before any investor can be matched to it."],
            ["target", "Strategy Matching", "Requirements are compared against live listings to find the best available fit."],
            ["zap", "Chainlink Automation", "Trigger-based execution follows the strategy, with no manual trading on your part."],
            ["layers", "Vault Contracts", "Investor deposits are held in dedicated vault contracts that strategies execute on."],
            ["file", "Commission Escrow", "Escrow contracts keep commission transparent whenever a trade makes a profit."],
            ["lock", "Private Strategy Logic", "Internal strategy flows are never shown to investors or exposed through public APIs."],
          ]}
        />
      </section>

      <section className="page-container">
        <CtaCenter
          title="Bring a strategy, or bring the capital"
          text="Create an account and take your side of the marketplace."
        >
          <InvestLink className={buttonClass()} />
          <PublishLink className={buttonClass("secondary")} />
        </CtaCenter>
      </section>

      <Faq
        spaced
        items={[
          ["Can investors see how a strategy works?", "No. Investors see its description and relevant metrics, but never its internal flow or node graph."],
          ["How do strategists earn?", "They earn commission on every profitable trade that uses their strategy. Loss-making strategies earn no rewards."],
          ["How are strategies rated?", "A strategy's rating rises when its trades make a profit and falls when it is found to be loss-making."],
          ["What if my asset is on another chain?", "Your deposit must be compatible with the selected strategy, so we will ask you to bridge it to that chain first."],
          ["Can I publish the same strategy twice?", "Not as an exact duplicate. You can publish the same logic for different trading pairs or pools."],
          ["Are returns guaranteed?", "No. Trading digital assets carries risk, including loss of your deposit, and a good rating does not promise future results."],
        ]}
      />
    </>
  );
}
