import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const points = [
  "This is a testing version, not the final product. Bugs and rough edges are expected, so please report anything that breaks.",
  "Data may be reset, lost or modified during testing. Don't rely on Ohmic as your only record of customer or repair data yet.",
  "There's no uptime guarantee. Occasional downtime or slowness is possible.",
  "Free during testing. Paid plans with different limits will apply once the platform is production-ready, and you'll be notified before anything changes.",
];

const BetaNotice = () => (
  <Dialog>
    <DialogTrigger asChild>
      <button
        type="button"
        className="rounded-full border border-[#a80000]/40 bg-[#a80000]/10 px-3 py-1 text-xs font-medium text-[#a80000] transition-colors hover:bg-[#a80000]/20"
      >
        Beta
      </button>
    </DialogTrigger>

    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Ohmic is in beta</DialogTitle>
        <DialogDescription>What to expect while we test.</DialogDescription>
      </DialogHeader>

      <ul className="list-disc space-y-3 pl-5 text-sm text-muted-foreground">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      <p className="text-sm text-muted-foreground">
        Questions or issues? Contact{" "}
        {/* reuse the same support link TestingNotice had */}
        <a href="#" className="font-medium text-foreground underline">
          support
        </a>
        .
      </p>
    </DialogContent>
  </Dialog>
);

export default BetaNotice;