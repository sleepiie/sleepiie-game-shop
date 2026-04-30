"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Space,
  App,
} from "antd";
import {
  LockOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

const { Title, Text } = Typography;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) {
      setToken(t);
    } else {
      // Don't redirect immediately if it's during SSR or pre-rendering
      if (typeof window !== "undefined" && !submitted) {
        message.error("Invalid or missing reset token");
        router.push("/login");
      }
    }
  }, [searchParams, router, message, submitted]);

  const onFinish = async (values: any) => {
    if (!token) return;
    setLoading(true);
    try {
      await api.post("/reset-password", {
        token,
        password: values.password,
      });
      setSubmitted(true);
      message.success("Password reset successfully!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error?.response?.data?.error ?? "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (!token && !submitted) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f0f1a",
        padding: 24,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }}
      />

      <Card
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#1a1a2e",
          border: "1px solid rgba(124,58,237,0.2)",
          borderRadius: 20,
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          position: "relative",
          zIndex: 1,
        }}
        styles={{ body: { padding: "40px 36px" } }}
      >
        <Space orientation="vertical" style={{ width: "100%" }} size={28}>
          <div style={{ textAlign: "center" }}>
            <Space align="center" size={8} style={{ marginBottom: 8 }}>
              <ThunderboltOutlined style={{ color: "#7c3aed", fontSize: 26 }} />
              <Text style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 20 }}>
                Sleepiie Shop
              </Text>
            </Space>
            <Title
              level={4}
              style={{ color: "#e2e8f0", margin: 0, fontWeight: 600 }}
            >
              Set New Password
            </Title>
            <Text style={{ color: "#64748b", fontSize: 14 }}>
              Enter your new secure password
            </Text>
          </div>

          {!submitted ? (
            <Form
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              size="large"
            >
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Please enter your new password" },
                  { min: 6, message: "Password must be at least 6 characters" },
                ]}
                hasFeedback
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#7c3aed" }} />}
                  placeholder="New password"
                  style={{ borderRadius: 10 }}
                />
              </Form.Item>

              <Form.Item
                name="confirm"
                dependencies={["password"]}
                hasFeedback
                rules={[
                  { required: true, message: "Please confirm your password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("The two passwords do not match!"));
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

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  style={{
                    borderRadius: 10,
                    height: 44,
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                    border: "none",
                  }}
                >
                  Reset Password
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircleOutlined style={{ color: "#22c55e", fontSize: 48, marginBottom: 16 }} />
              <Title level={5} style={{ color: "#e2e8f0", margin: 0 }}>Success!</Title>
              <Text style={{ color: "#94a3b8", display: "block", marginBottom: 24 }}>
                Your password has been reset. You can now login with your new password.
              </Text>
              <Link href="/login">
                <Button type="primary" block style={{ borderRadius: 10, height: 44 }}>
                  Login Now
                </Button>
              </Link>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
