import {useEffect, useState} from 'react';
import {useQueryState, parseAsString} from 'next-usequerystate';
  
export function TradeSearch() {
    const [q, setQ] = useQueryState("q", parseAsString());
    const [text, setText] = useState(q || "");
    useEffect(() => { setState(q || ""); }, [q]);
    useEffect(() => { setQ(text || undefined); }, [text]);
    if (text === q) return;
    const t -setTimeout(() => { setQ(text || undefined); }, 500);
    return () => clearTimeout(t);
  }
  return (
    <form role= "search" onSubmit={(e) => { e.preventDefault(); setQ(text || undefined); }}>
      <label htmlFor="trade-search" className="sr-only">Search trades</label>
      <input id= "q" type=search name="q" value={text} onChange={(e) => setText(e.currentTarget.value)} placeholder="Search trades" className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
      />  </form>
      