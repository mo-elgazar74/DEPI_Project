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
const API_BASE = rawApiBase ? rawApiBase.replace(/\/$/, "") : "http://localhost:4000";


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
  const [profile, setProfile] = useState(null);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

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
    const fetchProfile = async () => {
      if (!isLoaded || !user) return;
      try {
        const token = await getToken();
        if (!token) return;

        const profileRes = await fetch(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileRes.ok) {
          const { profile: profileData } = await profileRes.json();
          setProfile(profileData);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };

    fetchProfile();
  }, [isLoaded, user, getToken, profileVersion]);

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
      console.log(`Attempting to connect ${provider}...`);
      const externalAccount = await user.createExternalAccount({
        strategy: `oauth_${provider}`,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/profile`,
      });
      console.log("External account created:", externalAccount);
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
        toast.info(`Redirecting to ${provider} for authentication...`);
        window.location.href = redirectUrl;
      } else {
        await refreshUser();
        toast.success("Account connected successfully!");
      }
    } catch (err) {
      console.error("Error connecting provider:", err);
      console.error("Error details:", {
        errors: err?.errors,
        message: err?.message,
        clerkError: err?.clerkError,
      });
      const message =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        `Unable to connect ${provider}. Please make sure ${provider} OAuth is enabled in your Clerk dashboard.`;
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

  const handleSaveMetadata = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }

      // Convert ISO date to DD-MM-YYYY format if birthday was edited
      let birthday = profile.birthday;
      if (metadataDraft.birthdayIso) {
        const [yyyy, mm, dd] = metadataDraft.birthdayIso.split("-");
        birthday = `${dd}-${mm}-${yyyy}`;
      }

      const response = await fetch(`${API_BASE}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          birthday,
          grade: metadataDraft.grade ?? profile.grade,
          role: metadataDraft.role ?? profile.role,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save changes.");
      }

      // Refresh profile data
      const profileRes = await fetch(`${API_BASE}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const { profile: profileData } = await profileRes.json();
        setProfile(profileData);
      }

      await refreshUser();
      setMetadataDraft({});
      setIsEditingMetadata(false);
      toast.success("Academic profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Unable to save changes.");
    } finally {
      setIsSaving(false);
    }
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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">User Profile</h1>
          <Button variant="outline" onClick={() => navigate("/")} className="w-full sm:w-auto">
          ← Back to Home
          </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex w-full flex-wrap gap-1">
          <TabsTrigger value="profile" className="flex-1 min-w-[100px] sm:flex-none">
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 min-w-[100px] sm:flex-none">
            Security
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex-1 min-w-[100px] sm:flex-none">
            Danger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>
                      {user.firstName?.[0] || user.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2 text-center sm:text-left">
                    <p className="text-sm font-medium text-muted-foreground">{primaryEmail}</p>
                    <div className="inline-flex w-fit rounded-full bg-muted px-3 py-1 text-xs mx-auto sm:mx-0">
                      User since {createdAt}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-start">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    disabled={photoUploading}
                    className="flex-1 sm:flex-none"
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
                    <span className="text-muted-foreground">Last Sign In</span>
                    <span className="font-medium">
                      {user.lastSignInAt ? format(new Date(user.lastSignInAt), "PPp") : "N/A"}
                    </span>
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
                <h3 className="font-semibold">Academic Profile</h3>
                <div className="grid grid-cols-2 gap-4 rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Role</p>
                    <p className="text-lg font-semibold capitalize">
                      {profile?.role || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Grade</p>
                    <p className="text-lg font-semibold capitalize">
                      {String(profile?.grade || "N/A").replace("g", "Grade ")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Birthday</p>
                    <p className="text-lg font-semibold">
                      {profile?.birthday || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Birth Year</p>
                    <p className="text-lg font-semibold">
                      {profile?.birthYear || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Metadata Profile</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingMetadata(!isEditingMetadata)}
                  >
                    {isEditingMetadata ? "Cancel" : "Edit"}
                  </Button>
                </div>
                {!profile || Object.keys(profile || {}).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No academic data available.
                  </p>
                ) : (
                  <div className="space-y-4 rounded-lg border p-4">
                    {/* Role */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Role</Label>
                      {isEditingMetadata ? (
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={metadataDraft.role ?? profile.role ?? "student"}
                          onChange={(e) =>
                            setMetadataDraft((prev) => ({
                              ...prev,
                              role: e.target.value,
                            }))
                          }
                        >
                          <option value="student">Student</option>
                          <option value="parent">Parent</option>
                          <option value="teacher">Teacher</option>
                        </select>
                      ) : (
                        <p className="text-sm capitalize">{profile.role || "N/A"}</p>
                      )}
                    </div>

                    {/* Grade */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Grade</Label>
                      {isEditingMetadata ? (
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={metadataDraft.grade ?? profile.grade ?? "g1"}
                          onChange={(e) =>
                            setMetadataDraft((prev) => ({
                              ...prev,
                              grade: e.target.value,
                            }))
                          }
                        >
                          <option value="g1">Grade 1</option>
                          <option value="g2">Grade 2</option>
                          <option value="g3">Grade 3</option>
                          <option value="g4">Grade 4</option>
                          <option value="g5">Grade 5</option>
                          <option value="g6">Grade 6</option>
                        </select>
                      ) : (
                        <p className="text-sm capitalize">
                          {String(profile.grade || "N/A").replace("g", "Grade ")}
                        </p>
                      )}
                    </div>

                    {/* Birthday */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Birthday</Label>
                      {isEditingMetadata ? (
                        <Input
                          type="date"
                          value={metadataDraft.birthdayIso ?? ""}
                          onChange={(e) =>
                            setMetadataDraft((prev) => ({
                              ...prev,
                              birthdayIso: e.target.value,
                            }))
                          }
                          max={`${new Date().getFullYear()}-12-31`}
                        />
                      ) : (
                        <p className="text-sm">{profile.birthday || "N/A"}</p>
                      )}
                    </div>

                    {/* Birth Year */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Birth Year</Label>
                      <p className="text-sm">{profile.birthYear || "N/A"}</p>
                    </div>

                    {isEditingMetadata && (
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSaveMetadata} disabled={isSaving}>
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setMetadataDraft({});
                            setIsEditingMetadata(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
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
                    <AlertDialogTitle> Delete Account Verification </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete your account and all associated data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {deleteError && (
                    <p className="text-sm text-destructive">
                      {deleteError}
                    </p>
                  )}
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
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
