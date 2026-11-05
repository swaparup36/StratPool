// Product illustrations built from HTML so they follow the theme.
// Replace them with next/image screenshots when you have real ones.
import { Icon, type IconName } from "./icon";
import { Avatar, Avatars } from "./ui";

type Task = { label: string; title: string; text?: string; people: number[]; comments: number; files: number };

export function TaskCard({
  label,
  title,
  text,
  people,
  comments,
  files,
  className = "max-w-[260px]",
}: Task & { className?: string }) {
  return (
    <div className={`w-full rounded-lg border bg-surface-2 p-3.5 text-left ${className}`}>
      <span className="inline-block rounded-full bg-accent/22 px-2.5 py-px text-xs text-accent">{label}</span>
      <h4 className="mt-2.5 text-[15px]">{title}</h4>
      {text && <p className="mt-1 text-[13px] text-subtle">{text}</p>}
      <div className="mt-3.5 flex items-center justify-between text-[13px] text-subtle">
        <Avatars ids={people} borderClass="border-surface-2" />
        <div>
          <span className="ml-2 inline-flex items-center gap-1">
            <Icon name="message" /> {comments}
          </span>
          <span className="ml-2 inline-flex items-center gap-1">
            <Icon name="clip" /> {files}
          </span>
        </div>
      </div>
    </div>
  );
}

// StratPool landing illustrations. All values are examples, not real listings or results.
function Card({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-80 rounded-lg border bg-surface-2 p-4 text-left">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-[15px]">{title}</h4>
        {badge && <span className="rounded-full bg-accent/22 px-2.5 py-px text-xs text-accent">{badge}</span>}
      </div>
      <dl className="grid gap-2 text-[13px]">{children}</dl>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-subtle">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Note({ icon, children }: { icon: IconName; children: React.ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-md bg-surface-3 px-3 py-2 text-[13px]">
      <Icon name={icon} className="mt-[3px] flex-none" /> {children}
    </p>
  );
}

export function MatchMock() {
  return (
    <div className="bg-grid grid content-center place-items-center gap-4 rounded-xl border p-6 md:min-h-[400px]" aria-hidden="true">
      <div className="grid w-full items-center justify-items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="grid w-full justify-items-center md:justify-items-end">
          <Card title="Investor requirements">
            <Field label="Chain" value="Arbitrum" />
            <Field label="Trading type" value="Spot" />
            <Field label="Pair" value="ETH/USDC" />
            <Field label="Risk" value="Moderate" />
          </Card>
        </div>
        <Icon name="right" className="rotate-90 text-2xl text-accent md:rotate-0" />
        <div className="grid w-full justify-items-center md:justify-items-start">
          <Card title="ETH/USDC Momentum" badge="Best match">
            <Field label="Chain" value="Arbitrum" />
            <Field label="Trading type" value="Spot" />
            <Field label="Accepts" value="USDC, ETH" />
            <Field label="Rating" value="4.6 / 5" />
          </Card>
        </div>
      </div>
      <span className="text-[13px] text-subtle">Illustrative example</span>
    </div>
  );
}

export function PublishMock() {
  return (
    <Card title="New strategy">
      <Field label="Chain" value="Arbitrum" />
      <Field label="Pair" value="ETH/USDC" />
      <Field label="Pool" value="ETH/USDC 0.05%" />
      <Field label="Accepted assets" value="USDC, ETH" />
      <Note icon="check">Validated, no exact duplicate found</Note>
    </Card>
  );
}

export function OutcomeMock() {
  return (
    <div className="grid w-full max-w-80 gap-3">
      <Card title="Profitable trade" badge="Rating up">
        <Field label="Strategist commission" value="Earned" />
      </Card>
      <Card title="Loss-making strategy" badge="Rating down">
        <Field label="Strategist commission" value="None" />
      </Card>
    </div>
  );
}

export function VaultMock() {
  return (
    <Card title="Deposit to vault">
      <Field label="Your asset" value="USDC on Ethereum" />
      <Field label="Strategy runs on" value="Arbitrum" />
      <Note icon="alert">Bridge USDC to Arbitrum to continue</Note>
    </Card>
  );
}

export function StrategyViewMock() {
  return (
    <Card title="ETH/USDC Momentum">
      <Field label="Rating" value="4.6 / 5" />
      <Field label="Risk" value="Moderate" />
      <Field label="Pair" value="ETH/USDC" />
      <Note icon="lock">Internal strategy flow is private</Note>
    </Card>
  );
}

const feed = [
  { avatar: 1, who: "Nina", verb: "completed", what: "Homepage redesign", time: "2m ago" },
  { avatar: 5, who: "Daniel", verb: "commented on", what: "Release checklist", time: "8m ago" },
  { avatar: 3, who: "Priya", verb: "moved", what: "Billing fixes to Review", time: "21m ago" },
  { avatar: 6, who: "Maya", verb: "uploaded", what: "Launch plan.pdf", time: "1h ago" },
];

function MockWindow({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`mx-auto max-w-[1040px] rounded-xl border bg-surface-2 p-2 text-left ${className}`} aria-hidden="true">
      <div className="overflow-x-auto rounded-lg border bg-surface p-5">{children}</div>
    </div>
  );
}

export function ActivityFeedMock() {
  return (
    <MockWindow className="mt-12">
      <div className="grid gap-1">
        <div className="mb-3 flex items-center justify-between gap-3 font-medium">
          Live activity
          <span className="inline-flex items-center gap-1.5 text-[13px] font-normal text-subtle before:size-2 before:rounded-full before:bg-accent">
            Updating live
          </span>
        </div>
        {feed.map((row) => (
          <div className="flex min-w-[460px] items-center gap-3 rounded-lg p-3 text-sm even:bg-surface-2" key={row.who}>
            <Avatar id={row.avatar} className="size-8 rounded-full" />
            <span>
              <b className="font-medium">{row.who}</b> {row.verb} <b className="font-medium">{row.what}</b>
            </span>
            <time className="ml-auto text-[13px] whitespace-nowrap text-subtle">{row.time}</time>
          </div>
        ))}
      </div>
    </MockWindow>
  );
}

const board: { name: string; tasks: Task[] }[] = [
  {
    name: "To do",
    tasks: [
      { label: "Design", title: "Pricing page refresh", people: [1, 2], comments: 4, files: 1 },
      { label: "Copy", title: "Launch announcement", people: [3], comments: 12, files: 3 },
    ],
  },
  {
    name: "In progress",
    tasks: [
      { label: "Engineering", title: "Notification settings", people: [5, 6], comments: 7, files: 2 },
      { label: "Research", title: "Customer interviews", people: [8], comments: 3, files: 5 },
    ],
  },
  {
    name: "Done",
    tasks: [{ label: "Engineering", title: "Faster search", people: [3, 4], comments: 16, files: 4 }],
  },
];

export function BoardMock() {
  return (
    <MockWindow className="mb-12">
      <div className="grid grid-cols-[repeat(3,minmax(220px,1fr))] gap-4">
        {board.map((column) => (
          <div key={column.name}>
            <h4 className="mb-2.5 flex justify-between text-sm text-muted">
              {column.name} <span>{column.tasks.length}</span>
            </h4>
            {column.tasks.map((task) => (
              <TaskCard key={task.title} {...task} className="mb-3" />
            ))}
          </div>
        ))}
      </div>
    </MockWindow>
  );
}
