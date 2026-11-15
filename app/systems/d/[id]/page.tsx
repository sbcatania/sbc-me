import DiagramPage from "./DiagramPage";

// Static export: build one placeholder page. src/worker.ts serves it for every
// /systems/d/<id>, and DiagramPage reads the id from the URL.
export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function Page() {
  return <DiagramPage />;
}
