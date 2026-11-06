import { PotDetail } from "@/components/pot-detail";
export default async function PotPage({
  params,
}: {
  params: Promise<{ potId: string }>;
}) {
  const { potId } = await params;
  return <PotDetail address={potId} />;
}
