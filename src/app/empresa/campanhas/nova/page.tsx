import { NewCampaignForm } from "./new-campaign-form";

export default function NovaCampanhaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Nova campanha</h1>
        <p className="mt-1 text-sm text-zinc-500">
          A campanha nasce como rascunho — ative quando estiver pronta para receber afiliados.
        </p>
      </div>
      <NewCampaignForm />
    </div>
  );
}
