import {useEffect, useRef} from 'react';
export function StepHeading({children}: {children: React.ReactNode}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(()=> { ref.current?.focus(); }, []);
  return (
    <h2 ref={ref} tabIndex={-1} className="text-lg font-semibold">
      {children}
    </h2>
  );
}