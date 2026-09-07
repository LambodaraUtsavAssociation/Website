import RatLoader from '@/components/RatLoader';

export default function Loading() {
  return (
    <div className="min-h-screen pt-24 flex items-center justify-center bg-charcoal-950">
      <RatLoader message="Loading Sacred Gallery..." />
    </div>
  );
}
