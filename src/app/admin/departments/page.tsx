import DepartmentsAdmin from "@/components/DepartmentsAdmin";
export default function DepartmentsPage() {
  return (<div><h2 className="text-2xl font-bold mb-1">Department governance</h2>
    <p className="text-slate-500 mb-5">No department can log in until it is approved <b>and</b> separately activated. Activation needs verified documents, an officer, and typing ACTIVATE.</p>
    <DepartmentsAdmin /></div>);
}
