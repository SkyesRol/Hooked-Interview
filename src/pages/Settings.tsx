import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, PenTool, Save, Server, ShieldCheck, Sparkles, Wifi } from "lucide-react";
import OpenAI from "openai";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatClientError } from "@/lib/ai/client";
import { isSameOriginAsApp, normalizeBaseUrl } from "@/lib/ai/normalizeBaseUrl";
import { useSettingsStore } from "@/store/useSettingsStore";

const settingsSchema = z
  .object({
    apiKey: z.string().min(1, "请输入 API Key"),
    baseUrl: z.string().url("请输入有效的 URL (包含 http/https)"),
    model: z.string().min(1, "请输入模型名称"),
  });

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const apiKey = useSettingsStore((s) => s.apiKey);
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const model = useSettingsStore((s) => s.model);
  const setSettings = useSettingsStore((s) => s.setSettings);

  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const fromPathname = (location.state as { from?: string } | null)?.from;
  const showBackToHome = useMemo(() => fromPathname === "/" || Boolean(fromPathname), [fromPathname]);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { apiKey, baseUrl, model },
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset({ apiKey, baseUrl, model });
  }, [apiKey, baseUrl, model, form]);

  const handleTestConnection = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const values = form.getValues();
    const normalizedBaseUrl = normalizeBaseUrl(values.baseUrl);
    if (isSameOriginAsApp(normalizedBaseUrl)) {
      toast.error("Base URL 指向了当前前端站点，请填写真实的 API Host（例如 https://api.openai.com/v1）");
      return;
    }

    setIsTesting(true);
    try {
      const client = new OpenAI({
        apiKey: values.apiKey,
        baseURL: normalizedBaseUrl,
        dangerouslyAllowBrowser: true,
      });

      const payloadForLog = {
        model: values.model,
        messages: [{ role: "user", content: "hi" }],
      };

      console.log("[Test Connection] chat.completions payload:", payloadForLog);

      await client.chat.completions.create({
        model: values.model,
        messages: [{ role: "user", content: "hi" }],
      });

      toast.success("连接成功，模型可用");
    } catch (err) {
      toast.error(`连接失败: ${formatClientError(err)}`);
      console.error(err);
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = (values: SettingsFormValues) => {
    const normalized = { ...values, baseUrl: normalizeBaseUrl(values.baseUrl) };
    setSettings(normalized);
    form.setValue("baseUrl", normalized.baseUrl, { shouldDirty: false, shouldTouch: true, shouldValidate: true });
    toast.success("设置已保存");
  };

  return (
    <div className="min-h-screen overflow-x-hidden paper-surface font-ui text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-6 pb-3 pt-4">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 font-heading text-xl font-bold italic transition-colors hover:text-gold"
            >
              <PenTool className="h-4 w-4 text-gold" aria-hidden="true" />
              Frontend Playground
            </button>
            <div className="hidden items-center gap-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-light md:flex">
              <button type="button" onClick={() => navigate("/")} className="transition-colors hover:text-ink">
                PRACTICE
              </button>
              <button type="button" onClick={() => navigate("/history")} className="transition-colors hover:text-ink">
                HISTORY
              </button>
              <button type="button" onClick={() => navigate("/import")} className="transition-colors hover:text-ink">
                IMPORT QUESTIONS
              </button>
            </div>
          </div>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold">
            System <span className="text-gold italic">Settings</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm font-light text-ink-light">
            Configure your AI connection. All keys are stored locally in your browser.
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl">
          <div className="border-sketch bg-white p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-ink/10 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <Server className="h-5 w-5 text-ink" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-ink">AI Provider Configuration</h3>
                <p className="text-xs text-ink-light">Connect to OpenAI compatible services</p>
              </div>
            </div>

            <div className="mb-6">
              <Alert variant="warning" className="border-amber-200 bg-amber-50/50">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">
                  Your API Key is stored securely in your browser's LocalStorage and is never sent to our servers.
                </AlertDescription>
              </Alert>
            </div>

            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="baseUrl" className="text-xs font-bold uppercase tracking-wider text-ink-light">
                  API Base URL
                </Label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-light/50">
                    <Wifi className="h-4 w-4" />
                  </div>
                  <Input
                    id="baseUrl"
                    placeholder="https://api.openai.com/v1"
                    autoComplete="off"
                    {...form.register("baseUrl")}
                    className="border-slate-200 bg-slate-50/50 pl-10 font-code text-sm focus:border-gold focus:ring-gold"
                  />
                </div>
                {form.formState.errors.baseUrl?.message && (
                  <p className="text-xs font-medium text-red-500">{form.formState.errors.baseUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-xs font-bold uppercase tracking-wider text-ink-light">
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    placeholder="sk-..."
                    type={showApiKey ? "text" : "password"}
                    autoComplete="off"
                    {...form.register("apiKey")}
                    className="border-slate-200 bg-slate-50/50 pr-10 font-code text-sm focus:border-gold focus:ring-gold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-light hover:bg-slate-200/50"
                    aria-label={showApiKey ? "Hide API Key" : "Show API Key"}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.apiKey?.message && (
                  <p className="text-xs font-medium text-red-500">{form.formState.errors.apiKey.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-xs font-bold uppercase tracking-wider text-ink-light">
                  Model Name
                </Label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-light/50">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <Input
                    id="model"
                    placeholder="gpt-3.5-turbo"
                    autoComplete="off"
                    {...form.register("model")}
                    className="border-slate-200 bg-slate-50/50 pl-10 font-code text-sm focus:border-gold focus:ring-gold"
                  />
                </div>
                {form.formState.errors.model?.message && (
                  <p className="text-xs font-medium text-red-500">{form.formState.errors.model.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="border-sketch bg-white text-ink hover:bg-slate-50 hover:text-gold"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>

                <div className="flex items-center gap-3">
                  {showBackToHome && (
                    <Link
                      to={fromPathname ?? "/"}
                      className="text-xs font-bold uppercase tracking-wider text-ink-light hover:text-ink hover:underline"
                    >
                      Cancel
                    </Link>
                  )}
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting || isTesting}
                    className="bg-ink text-white hover:bg-gold hover:text-ink font-bold uppercase tracking-wider"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
