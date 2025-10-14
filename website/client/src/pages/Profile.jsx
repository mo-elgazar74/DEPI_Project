import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/edubot/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/edubot/ui/card";
import { Button } from "@/components/edubot/ui/button";
import { Input } from "@/components/edubot/ui/input";
import { Label } from "@/components/edubot/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/edubot/ui/avatar";
import { Badge } from "@/components/edubot/ui/badge";
import { Separator } from "@/components/edubot/ui/separator";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/edubot/ui/alert-dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const formatMetadataValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch (err) {
      console.warn("Failed to stringify private metadata value", err);
      return "";
    }
  }
  return String(value);
};

const parseMetadataInput = (raw, existingValue) => {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) {
    return { shouldDelete: true, value: undefined };
  }

  const lower = trimmed.toLowerCase();
  if (typeof existingValue === "boolean") {
    if (["true", "false"].includes(lower)) {
      return { shouldDelete: false, value: lower === "true" };
    }
    throw new Error("القيمة يجب أن تكون true أو false.");
  }

  if (typeof existingValue === "number") {
    const numeric = Number(trimmed);
    if (Number.isNaN(numeric)) {
      throw new Error("القيمة يجب أن تكون رقمًا صالحًا.");
    }
    return { shouldDelete: false, value: numeric };
  }

  if (
    typeof existingValue === "object" ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[")
  ) {
    try {
      const parsed = JSON.parse(trimmed);
      return { shouldDelete: false, value: parsed };
    } catch (err) {
      throw new Error("صيغة JSON غير صحيحة. تأكد من سلامة البنية.");
    }
  }

  if (["true", "false"].includes(lower)) {
    return { shouldDelete: false, value: lower === "true" };
  }

  if (!Number.isNaN(Number(trimmed)) && trimmed.trim() !== "") {
    const numeric = Number(trimmed);
    if (String(numeric) === trimmed || trimmed.match(/^\d+$/)) {
      return { shouldDelete: false, value: numeric };
    }
  }

  return { shouldDelete: false, value: trimmed };
};

const AVAILABLE_PROVIDERS = ["google", "microsoft", "github", "facebook"];
const PROVIDER_LABELS = {
  google: "Google",
  microsoft: "Microsoft",
  github: "GitHub",
  facebook: "Facebook",
};

const rawApiBase = import.meta.env.VITE_API_BASE?.trim() || "";
const API_BASE = rawApiBase ? rawApiBase.replace(/\/$/, "") : "";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profileVersion, setProfileVersion] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [metadataDraft, setMetadataDraft] = useState({});
  const [metadataSavingKey, setMetadataSavingKey] = useState("");
  const [emailList, setEmailList] = useState([]);
  const [externalAccounts, setExternalAccounts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [addingEmail, setAddingEmail] = useState(false);
  const [emailAction, setEmailAction] = useState("");
  const [connectBusy, setConnectBusy] = useState("");
  const [disconnectBusy, setDisconnectBusy] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!user || !isLoaded) return;
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setEmailList([...(user.emailAddresses || [])]);
    setExternalAccounts([...(user.externalAccounts || [])]);
    setMetadataDraft(
      Object.entries(user.privateMetadata || {}).reduce((acc, [key, value]) => {
        acc[key] = formatMetadataValue(value);
        return acc;
      }, {}),
    );
    setAvatarPreview("");
  }, [user, isLoaded, profileVersion]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  if (!isLoaded || !user)
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );

  const refreshUser = async () => {
    await user.reload();
    setProfileVersion((v) => v + 1);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await user.update({
        firstName,
        lastName,
      });
      await refreshUser();
      toast.success("تم تحديث الملف الشخصي بنجاح.");
    } catch (err) {
      console.error(err);
      toast.error("تعذر حفظ التعديلات.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setPhotoUploading(true);
    try {
      await user.setProfileImage({ file });
      await refreshUser();
      toast.success("Profile photo updated");
    } catch (err) {
      console.error(err);
      toast.error("تعذر تحديث الصورة.");
      setAvatarPreview("");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setPhotoUploading(false);
    }
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("يرجى إدخال بريد إلكتروني صالح.");
      return;
    }
    setAddingEmail(true);
    try {
      const emailResource = await user.createEmailAddress({
        emailAddress: newEmail.trim(),
      });
      setEmailList((prev) => {
        const filtered = prev.filter((item) => item.id !== emailResource.id);
        return [...filtered, emailResource];
      });
      if (emailResource?.prepareVerification) {
        await emailResource.prepareVerification({ strategy: "email_code" });
      }
      await refreshUser();
      setNewEmail("");
      toast.success("تمت إضافة البريد الإلكتروني. تحقق من بريدك لتأكيده.");
    } catch (err) {
      console.error(err);
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        "تعذر إضافة البريد الإلكتروني.";
      toast.error(message);
    } finally {
      setAddingEmail(false);
    }
  };

  const handleSetPrimaryEmail = async (emailId) => {
    const email =
      emailList.find((item) => item.id === emailId) ||
      user.emailAddresses?.find((item) => item.id === emailId);
    if (!email) return;
    setEmailAction(`${emailId}:primary`);
    try {
      if (email.makePrimary) {
        await email.makePrimary();
      } else if (user.update) {
        await user.update({ primaryEmailAddressId: email.id });
      }
      await refreshUser();
      toast.success("تم تعيين البريد الإلكتروني كبريد أساسي.");
    } catch (err) {
      console.error(err);
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        "تعذر تعيين البريد كبريد أساسي.";
      toast.error(message);
    } finally {
      setEmailAction("");
    }
  };

  const handleResendVerification = async (emailId) => {
    const email =
      emailList.find((item) => item.id === emailId) ||
      user.emailAddresses?.find((item) => item.id === emailId);
    if (!email) return;
    setEmailAction(`${emailId}:verify`);
    try {
      if (email.prepareVerification) {
        await email.prepareVerification({ strategy: "email_code" });
      } else if (user.prepareEmailAddressVerification) {
        await user.prepareEmailAddressVerification({
          emailAddressId: email.id,
          strategy: "email_code",
        });
      }
      toast.success("تم إرسال رسالة التحقق.");
    } catch (err) {
      console.error(err);
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        "تعذر إعادة إرسال رسالة التحقق.";
      toast.error(message);
    } finally {
      setEmailAction("");
    }
  };

  const getProviderLabel = (provider) => {
    if (!provider) return "Unknown";
    const key = provider.toLowerCase?.() || provider;
    return PROVIDER_LABELS[key] || provider;
  };

  const extractAccountLabel = (account) => {
    const name = [account.firstName, account.lastName].filter(Boolean).join(" ");
    return (
      account.emailAddress ||
      account.username ||
      name ||
      account.providerUserId ||
      account.id?.slice(0, 8) ||
      "—"
    );
  };

  const handleConnectProvider = async (provider) => {
    setConnectBusy(provider);
    try {
      const externalAccount = await user.createExternalAccount({
        strategy: `oauth_${provider}`,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/profile`,
      });
      const verification =
        externalAccount?.firstFactorVerification ||
        externalAccount?.verification ||
        externalAccount?.secondFactorVerification;
      const redirectUrl =
        verification?.externalVerificationRedirectURL ||
        verification?.externalVerificationRedirectUrl ||
        verification?.external_verification_redirect_url ||
        verification?.url;
      if (redirectUrl) {
        toast.info("سيتم إعادة توجيهك لمقدم الخدمة لإكمال الربط.");
        window.location.href = redirectUrl;
      } else {
        await refreshUser();
        toast.success("تم ربط الحساب الخارجي.");
      }
    } catch (err) {
      console.error(err);
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        "تعذر الاتصال بالحساب الخارجي.";
      toast.error(message);
    } finally {
      setConnectBusy("");
    }
  };

  const handleDisconnectProvider = async (externalAccountId) => {
    setDisconnectBusy(externalAccountId);
    try {
      await user.unlinkExternalAccount(externalAccountId);
      await refreshUser();
      toast.success("تم فصل الحساب الخارجي.");
    } catch (err) {
      console.error(err);
      toast.error("تعذر فصل الحساب الخارجي.");
    } finally {
      setDisconnectBusy("");
    }
  };

  const handleUpdateMetadata = async (key) => {
    setMetadataSavingKey(key);
    try {
      const currentValue = user.privateMetadata?.[key];
      const { shouldDelete, value } = parseMetadataInput(
        metadataDraft[key],
        currentValue,
      );
      const nextMetadata = { ...(user.privateMetadata || {}) };
      if (shouldDelete) {
        delete nextMetadata[key];
      } else {
        nextMetadata[key] = value;
      }
      await user.update({ privateMetadata: nextMetadata });
      await refreshUser();
      toast.success("تم تحديث البيانات الخاصة.");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "تعذر تحديث البيانات الخاصة.");
    } finally {
      setMetadataSavingKey("");
    }
  };

  const handleResetMetadataValue = (key) => {
    setMetadataDraft((prev) => ({
      ...prev,
      [key]: formatMetadataValue(user.privateMetadata?.[key]),
    }));
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleDeleteAccount = useCallback(async () => {
    if (deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      const token = await getToken();
      const base = API_BASE || window.location.origin;
      const url = `${base}/api/profile/delete`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || payload?.message || response.statusText || "تعذر حذف الحساب.");
      }

      toast.success("تم حذف الحساب.");
      setDeleteOpen(false);
      await signOut({ redirectUrl: "/" });
    } catch (err) {
      console.error("Failed to delete account via API:", err);
      const message = err?.message || "تعذر حذف الحساب.";
      toast.error(message);
      setDeleteOpen(true);
      setDeleteError(message);
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteBusy, getToken, signOut]);

  const createdAt = useMemo(() => {
    try {
      return format(new Date(user.createdAt), "PPP");
    } catch (error) {
      return new Date(user.createdAt).toLocaleDateString();
    }
  }, [user.createdAt]);

  const primaryEmail = user.primaryEmailAddress?.emailAddress || "No email";
  const primaryEmailId = user.primaryEmailAddressId;
  const avatarSrc = avatarPreview || user.imageUrl;
  const emailAddresses = emailList;
  const connectedProviders = useMemo(
    () =>
      new Set(
        (externalAccounts || []).map((account) =>
          (account.provider || "").toLowerCase(),
        ),
      ),
    [externalAccounts],
  );
  const providersToOffer = useMemo(
    () =>
      AVAILABLE_PROVIDERS.filter(
        (provider) => !connectedProviders.has(provider.toLowerCase()),
      ),
    [connectedProviders],
  );

  const metadataKeys = useMemo(
    () => Object.keys(metadataDraft || {}),
    [metadataDraft],
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Profile</h1>
        <Button variant="outline" onClick={() => navigate("/")}>
          ← Back to Home
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="profile" className="flex-1 sm:flex-none">
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 sm:flex-none">
            Security
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex-1 sm:flex-none">
            Danger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>
                      {user.firstName?.[0] || user.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">{primaryEmail}</p>
                    <p>User since {createdAt}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    disabled={photoUploading}
                  >
                    {photoUploading ? "Uploading…" : "Change Photo"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </div>
                <div className="space-y-2 rounded-lg border bg-muted/20 p-4 text-sm md:col-span-2 lg:col-span-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">User ID</span>
                    <span className="break-all font-medium">{user.id}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Primary Email</span>
                    <span className="break-all font-medium">{primaryEmail}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">User Since</span>
                    <span className="font-medium">{createdAt}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Email Addresses</h3>
                  <div className="space-y-3">
                    {emailAddresses.map((email) => {
                      const isPrimary = email.id === primaryEmailId;
                      const status = email.verification?.status || "unverified";
                      const isVerified = status === "verified";
                      return (
                        <div
                          key={email.id}
                          className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="break-all font-medium">
                              {email.emailAddress}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">
                                {isPrimary ? "Primary" : "Secondary"}
                              </Badge>
                              <Badge variant={isVerified ? "default" : "outline"}>
                                {isVerified ? "Verified" : "Unverified"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {!isPrimary && (
                              <Button
                                size="sm"
                                disabled={emailAction === `${email.id}:primary`}
                                onClick={() => handleSetPrimaryEmail(email.id)}
                              >
                                {emailAction === `${email.id}:primary`
                                  ? "Setting..."
                                  : "Set Primary"}
                              </Button>
                            )}
                            {!isVerified && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={emailAction === `${email.id}:verify`}
                                onClick={() => handleResendVerification(email.id)}
                              >
                                {emailAction === `${email.id}:verify`
                                  ? "Sending..."
                                  : "Resend Verification"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    placeholder="Enter new email"
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    className="sm:max-w-sm"
                  />
                  <Button onClick={handleAddEmail} disabled={addingEmail}>
                    {addingEmail ? "Adding..." : "Add Email"}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold">Connected Accounts</h3>
                <div className="space-y-2">
                  {(externalAccounts || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      لا توجد حسابات خارجية مرتبطة.
                    </p>
                  ) : (
                    (externalAccounts || []).map((account) => {
                      const providerLabel = getProviderLabel(account.provider);
                      return (
                        <div
                          key={account.id}
                          className="flex items-center justify-between rounded-lg border px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium capitalize">
                              {providerLabel}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {extractAccountLabel(account)}
                            </p>
                          </div>
                          <AlertDialog
                            onOpenChange={(open) => {
                              if (!open) {
                                setDisconnectBusy("");
                              }
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={Boolean(disconnectBusy)}
                              >
                                {disconnectBusy === account.id
                                  ? "Disconnecting..."
                                  : "Disconnect"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>فصل حساب خارجي</AlertDialogTitle>
                                <AlertDialogDescription>
                                  سيتم فصل حساب {providerLabel} المرتبط بالمستخدم. يمكنك إعادة الربط لاحقًا.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  onClick={() => setDisconnectBusy("")}
                                  disabled={disconnectBusy === account.id}
                                >
                                  إلغاء
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  disabled={disconnectBusy === account.id}
                                  onClick={async (event) => {
                                    event.preventDefault();
                                    await handleDisconnectProvider(account.id);
                                  }}
                                >
                                  تأكيد الفصل
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {providersToOffer.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      تم ربط جميع مقدمي الخدمة المتاحة.
                    </p>
                  ) : (
                    providersToOffer.map((provider) => (
                      <Button
                        key={provider}
                        variant="outline"
                        disabled={connectBusy === provider}
                        onClick={() => handleConnectProvider(provider)}
                      >
                        {connectBusy === provider
                          ? "Connecting..."
                          : `ربط حساب ${getProviderLabel(provider)}`}
                      </Button>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Private Metadata</h3>
                {metadataKeys.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    لا توجد بيانات خاصة محفوظة لهذا المستخدم.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {metadataKeys.map((key) => (
                      <div
                        key={key}
                        className="rounded-lg border bg-muted/20 p-3"
                      >
                        <Label className="text-xs uppercase text-muted-foreground">
                          {key}
                        </Label>
                        <Input
                          className="mt-2"
                          value={metadataDraft[key] ?? ""}
                          placeholder="القيمة غير محددة"
                          onChange={(event) =>
                            setMetadataDraft((prev) => ({
                              ...prev,
                              [key]: event.target.value,
                            }))
                          }
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          اترك الحقل فارغًا ثم احفظ لحذف هذا المفتاح.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateMetadata(key)}
                            disabled={metadataSavingKey === key}
                          >
                            {metadataSavingKey === key ? "Saving..." : "حفظ التغيير"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={metadataSavingKey === key}
                            onClick={() => handleResetMetadataValue(key)}
                          >
                            إعادة التعيين
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => navigate("/forgot-password")}>
                Change Password
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Log out of this device
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="border-red-500">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back.
              </p>
              <AlertDialog
                open={deleteOpen}
                onOpenChange={(open) => {
                  if (!deleteBusy) {
                    setDeleteOpen(open);
                  }
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>تأكيد حذف الحساب</AlertDialogTitle>
                    <AlertDialogDescription>
                      سيتم حذف حسابك وجميع بياناته بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {deleteError && (
                    <p className="text-sm text-destructive">
                      {deleteError}
                    </p>
                  )}
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteBusy}>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={deleteBusy}
                      onClick={async () => {
                        await handleDeleteAccount();
                      }}
                    >
                      {deleteBusy ? "Deleting..." : "Confirm Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
