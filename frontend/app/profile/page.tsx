"use client";

import React, { useEffect, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  Row,
  Col,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  ArrowLeftOutlined,
  LinkOutlined,
  LockOutlined,
  SaveOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { UpdateProfilePayload, User } from "@/types";

const { Title, Text } = Typography;

interface ProfileFormValues {
  avatar_url: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm<ProfileFormValues>();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get<User>("/profile");
        setProfile(res.data);
        setAvatarPreview(res.data.avatar_url ?? "");
      } catch (err: unknown) {
        const error = err as { response?: { status?: number } };
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        message.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [form, message, router]);

  const onAvatarURLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarPreview(event.target.value.trim());
  };

  const onFinish = async (values: ProfileFormValues) => {
    if (!profile) {
      return;
    }

    const nextAvatarURL = values.avatar_url.trim();
    const currentAvatarURL = (profile.avatar_url ?? "").trim();
    const passwordChanged = values.new_password.trim() !== "";

    if (!passwordChanged && nextAvatarURL === currentAvatarURL) {
      message.info("No changes to save");
      return;
    }

    const payload: UpdateProfilePayload = {};

    if (nextAvatarURL !== currentAvatarURL) {
      payload.avatar_url = nextAvatarURL;
    }

    if (passwordChanged) {
      payload.current_password = values.current_password;
      payload.new_password = values.new_password;
    }

    setSaving(true);
    try {
      const res = await api.put<User>("/profile", payload);
      setProfile(res.data);
      setAvatarPreview(res.data.avatar_url ?? "");
      form.setFieldsValue({
        avatar_url: res.data.avatar_url ?? "",
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      window.dispatchEvent(new Event("profile-updated"));
      message.success("Profile updated successfully");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error?.response?.data?.error ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a" }}>
      <Navbar />

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>
        <Space orientation="vertical" size={24} style={{ width: "100%" }}>
          <Link href="/" style={{ width: "fit-content" }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              style={{ color: "#94a3b8", paddingInline: 0 }}
            >
              Back to store
            </Button>
          </Link>

          <div>
            <Title level={2} style={{ color: "#e2e8f0", marginBottom: 8 }}>
              Profile Settings
            </Title>
            <Text style={{ color: "#94a3b8" }}>
              Update your avatar URL and change your password.
            </Text>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "96px 0" }}>
              <Spin size="large" />
            </div>
          ) : (
            <Card
              style={{
                background: "#1a1a2e",
                border: "1px solid rgba(124,58,237,0.14)",
                borderRadius: 20,
              }}
              styles={{ body: { padding: 28 } }}
            >
              <Row gutter={[28, 28]}>
                <Col xs={24} lg={8}>
                  <div
                    style={{
                      padding: 24,
                      borderRadius: 18,
                      border: "1px solid rgba(124,58,237,0.12)",
                      background:
                        "linear-gradient(180deg, rgba(124,58,237,0.14) 0%, rgba(15,15,26,0.5) 100%)",
                    }}
                  >
                    <Space orientation="vertical" size={18} style={{ width: "100%" }}>
                      <Avatar
                        size={112}
                        src={avatarPreview || undefined}
                        icon={<UserOutlined />}
                        style={{ background: "#7c3aed", alignSelf: "center" }}
                      />
                      <div>
                        <Text style={{ color: "#64748b", fontSize: 12, display: "block" }}>
                          Email
                        </Text>
                        <Text style={{ color: "#e2e8f0", fontSize: 15 }}>
                          {profile?.email}
                        </Text>
                      </div>
                      <div>
                        <Text style={{ color: "#64748b", fontSize: 12, display: "block" }}>
                          Role
                        </Text>
                        <Tag color={profile?.role === "admin" ? "gold" : "blue"} style={{ marginTop: 6 }}>
                          {profile?.role}
                        </Tag>
                      </div>
                    </Space>
                  </div>
                </Col>

                <Col xs={24} lg={16}>
                  <Form<ProfileFormValues>
                    form={form}
                    key={profile?.id}
                    initialValues={{
                      avatar_url: profile?.avatar_url ?? "",
                      current_password: "",
                      new_password: "",
                      confirm_password: "",
                    }}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                  >
                    <Form.Item
                      label={<Text style={{ color: "#cbd5e1" }}>Avatar URL</Text>}
                      name="avatar_url"
                      rules={[
                        {
                          validator: async (_, value: string) => {
                            const trimmed = value?.trim() ?? "";
                            if (!trimmed) {
                              return;
                            }

                            try {
                              const parsed = new URL(trimmed);
                              if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                                throw new Error("invalid");
                              }
                            } catch {
                              throw new Error("Please enter a valid http or https URL");
                            }
                          },
                        },
                      ]}
                      extra={<Text style={{ color: "#64748b" }}>Leave empty to remove your current avatar.</Text>}
                    >
                      <Input
                        prefix={<LinkOutlined style={{ color: "#7c3aed" }} />}
                        placeholder="https://example.com/avatar.jpg"
                        onChange={onAvatarURLChange}
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Item>

                    <Form.Item
                      label={<Text style={{ color: "#cbd5e1" }}>Email</Text>}
                    >
                      <Input value={profile?.email} disabled style={{ borderRadius: 10 }} />
                    </Form.Item>

                    <div
                      style={{
                        margin: "12px 0 20px",
                        paddingTop: 20,
                        borderTop: "1px solid rgba(124,58,237,0.12)",
                      }}
                    >
                      <Title level={5} style={{ color: "#e2e8f0", marginBottom: 8 }}>
                        Change Password
                      </Title>
                      <Text style={{ color: "#64748b" }}>
                        Fill these fields only when you want to change your password.
                      </Text>
                    </div>

                    <Form.Item
                      label={<Text style={{ color: "#cbd5e1" }}>Current Password</Text>}
                      name="current_password"
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!getFieldValue("new_password") || value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error("Please enter your current password"));
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: "#7c3aed" }} />}
                        placeholder="Current password"
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Item>

                    <Form.Item
                      label={<Text style={{ color: "#cbd5e1" }}>New Password</Text>}
                      name="new_password"
                      rules={[
                        { min: 6, message: "New password must be at least 6 characters" },
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: "#7c3aed" }} />}
                        placeholder="New password"
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Item>

                    <Form.Item
                      label={<Text style={{ color: "#cbd5e1" }}>Confirm New Password</Text>}
                      name="confirm_password"
                      dependencies={["new_password"]}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!getFieldValue("new_password") && !value) {
                              return Promise.resolve();
                            }
                            if (value !== getFieldValue("new_password")) {
                              return Promise.reject(new Error("Passwords do not match"));
                            }
                            return Promise.resolve();
                          },
                        }),
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: "#7c3aed" }} />}
                        placeholder="Confirm new password"
                        style={{ borderRadius: 10 }}
                      />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 28 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={saving}
                        style={{
                          borderRadius: 10,
                          height: 44,
                          paddingInline: 20,
                          background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                          border: "none",
                        }}
                      >
                        Save Changes
                      </Button>
                    </Form.Item>
                  </Form>
                </Col>
              </Row>
            </Card>
          )}
        </Space>
      </main>
    </div>
  );
}
