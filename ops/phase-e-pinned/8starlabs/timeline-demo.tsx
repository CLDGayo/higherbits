import Timeline, {
  TimelineItem,
  TimelineItemDate,
  TimelineItemTitle,
  TimelineItemDescription,
} from "@/components/auto-index/timeline";

const milestones = [
  { date: "Jan 8, 2026", title: "Idea", description: "Set the goal and agree on the first milestone." },
  { date: "Feb 12, 2026", title: "Design", description: "Turn the plan into a working prototype." },
  { date: "Mar 20, 2026", title: "Launch", description: "Release the finished experience." },
];

export default function TimelineDemo() {
  return (
    <Timeline orientation="horizontal">
      {milestones.map((item) => (
        <TimelineItem key={item.title}>
          <TimelineItemDate>{item.date}</TimelineItemDate>
          <TimelineItemTitle>{item.title}</TimelineItemTitle>
          <TimelineItemDescription>{item.description}</TimelineItemDescription>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
