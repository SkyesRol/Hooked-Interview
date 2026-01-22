import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";
import OpenAI from "openai";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatClientError } from "@/lib/ai/client";
import { cn } from "@/lib/utils";
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
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>全局配置</CardTitle>
            <CardDescription>配置你的 AI 接口信息（配置仅存储在本地浏览器；题库与面试记录存储在 IndexedDB）。</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>您的 API Key 仅存储在本地浏览器中，绝不会上传至任何服务器。</AlertDescription>
            </Alert>

            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="baseUrl">API Base URL</Label>
                <Input
                  id="baseUrl"
                  placeholder="https://api.openai.com/v1"
                  autoComplete="off"
                  {...form.register("baseUrl")}
                />
                {form.formState.errors.baseUrl?.message ? (
                  <p className="text-sm text-red-600">{form.formState.errors.baseUrl.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    placeholder="sk-..."
                    type={showApiKey ? "text" : "password"}
                    autoComplete="off"
                    {...form.register("apiKey")}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-500 hover:bg-slate-100",
                    )}
                    aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.apiKey?.message ? (
                  <p className="text-sm text-red-600">{form.formState.errors.apiKey.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">模型</Label>
                <Input id="model" placeholder="gpt-3.5-turbo" autoComplete="off" {...form.register("model")} />
                {form.formState.errors.model?.message ? (
                  <p className="text-sm text-red-600">{form.formState.errors.model.message}</p>
                ) : null}
              </div>

              <CardFooter className="gap-3 px-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      测试连接
                    </>
                  ) : (
                    "测试连接"
                  )}
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || isTesting}>
                  保存配置
                </Button>

                {showBackToHome ? (
                  <Link
                    to={fromPathname ?? "/"}
                    className={
                      "ml-auto inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                    }
                  >
                    返回首页
                  </Link>
                ) : null}
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
