// Product illustrations built from HTML so they follow the theme.
// Replace them with next/image screenshots when you have real ones.
import { Icon } from "./icon";
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

export function ChatMock() {
  const bubble = "w-fit rounded-[14px] px-3.5 py-2 text-[15px]";
  return (
    <div className="grid w-full max-w-80 gap-3">
      <span className={`${bubble} justify-self-end rounded-br-[3px] bg-accent text-on-accent`}>
        how does the new flow look?
      </span>
      <span className={`${bubble} rounded-bl-[3px] bg-surface-3`}>really good, let&apos;s ship it!</span>
    </div>
  );
}

export function NewTaskMock() {
  return (
    <div className="grid w-full justify-items-center">
      <div className="mb-3 flex h-9 w-full max-w-[260px] items-center justify-center gap-1 rounded-md border text-sm text-accent">
        <Icon name="plus" /> Add new task
      </div>
      <TaskCard
        label="Copy"
        title="Launch announcement"
        text="Draft the announcement post covering the key benefits of the new release and how to get started."
        people={[1, 2, 3]}
        comments={12}
        files={3}
      />
    </div>
  );
}

export function SecureMock() {
  return (
    <div className="inline-flex items-center gap-2 rounded-lg bg-surface-3 px-4 py-2.5">
      <Icon name="lock" /> End-to-end encrypted backup
    </div>
  );
}

export function PeopleMock() {
  const avatar = "size-16 rounded-full border-4 md:size-[88px]";
  return (
    <div className="bg-grid grid min-h-[340px] place-items-center rounded-xl border md:min-h-[460px]" aria-hidden="true">
      <div className="grid justify-items-center gap-4">
        <div className="relative rounded-lg border bg-surface-2 px-5 py-2 text-center text-lg leading-[1.3]">
          <small className="block text-[15px] text-subtle">Sarah</small>Click to follow
        </div>
        <div className="flex">
          <Avatar id={1} className={`${avatar} border-surface`} />
          <Avatar id={2} className={`${avatar} relative -ml-5 scale-115 border-accent`} />
          <Avatar id={3} className={`${avatar} -ml-5 border-surface`} />
        </div>
      </div>
    </div>
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
