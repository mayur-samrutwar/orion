import React from "react";

export default function PrrofPage() {
  const invoices = [
    {
      label: "Silver Invoice",
      url: "https://gfa-loan-prod.s3.ap-south-1.amazonaws.com/public/uploads/invoice/invoice1758705852813.pdf",
      metal: "Silver",
    },
    {
      label: "Gold Invoice",
      url: "https://gfa-loan-prod.s3.ap-south-1.amazonaws.com/public/uploads/invoice/invoice1758699679206.pdf",
      metal: "Gold",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-black py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Proof of Invoices</h1>
          <p className="text-sm text-black/60 dark:text-white/60 mt-1">Date: 24th Sept 2025</p>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {invoices.map((inv) => (
            <a
              key={inv.url}
              href={inv.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/70 dark:bg-white/5 backdrop-blur p-4 flex items-center justify-between transition hover:ring-black/10 dark:hover:ring-white/20"
            >
              <div className="text-sm font-medium">{inv.label}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">{inv.metal}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4 text-black/50 dark:text-white/60 group-hover:text-black/70 dark:group-hover:text-white/80"
                  aria-hidden="true"
                >
                  <path d="M14 3a1 1 0 1 0 0 2h3.586l-8.293 8.293a1 1 0 0 0 1.414 1.414L19 6.414V10a1 1 0 1 0 2 0V4a1 1 0 0 0-1-1h-6z" />
                  <path d="M5 5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a1 1 0 1 0-2 0v6H5V7h6a1 1 0 1 0 0-2H5z" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}


