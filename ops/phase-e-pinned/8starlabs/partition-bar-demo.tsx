import PartitionBar, {
  PartitionBarSegment,
  PartitionBarSegmentTitle,
  PartitionBarSegmentValue,
} from "@/components/auto-index/partition-bar";

export default function PartitionBarDemo() {
  return (
    <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-5 text-lg font-semibold text-slate-900">Fruit harvest</h2>
      <PartitionBar size="md" gap={2}>
        <PartitionBarSegment num={3}>
          <PartitionBarSegmentTitle>Apples</PartitionBarSegmentTitle>
          <PartitionBarSegmentValue>30%</PartitionBarSegmentValue>
        </PartitionBarSegment>
        <PartitionBarSegment num={7} variant="secondary">
          <PartitionBarSegmentTitle>Oranges</PartitionBarSegmentTitle>
          <PartitionBarSegmentValue>70%</PartitionBarSegmentValue>
        </PartitionBarSegment>
      </PartitionBar>
    </div>
  );
}
