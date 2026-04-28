"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  Space,
  Button,
  Empty,
  Spin,
  Tag,
  Divider,
  App,
  Popconfirm,
  Modal,
  Result,
} from "antd";
import {
  DeleteOutlined,
  ShoppingOutlined,
  ThunderboltOutlined,
  ArrowLeftOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";
import { CartItem, CartResponse } from "@/types";

const { Title, Text, Paragraph } = Typography;

const STRIPE_PK =
  "pk_test_51TPfr4ERK9dLOA6hMczDqLET9PaTRGpWVQf1qADURkho2VGf9j3qXKdewNgjA3sHPjDeEqCLTRx29CL8YYUNBUgL00frwNLuK6";
const stripePromise = loadStripe(STRIPE_PK);

const platformColors: Record<string, string> = {
  Steam: "blue",
  PlayStation: "geekblue",
  Xbox: "green",
  Nintendo: "red",
  "Epic Games": "purple",
};

/* ─── Stripe Checkout Form ─────────────────────────────────── */

function CheckoutForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { message } = App.useApp();
  const [paying, setPaying] = useState(false);
  const [ready, setReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    try {
      const { paymentIntent, error } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        message.error(error.message ?? "Payment failed");
      } else if (paymentIntent) {
        if (paymentIntent.status === "succeeded") {
          onSuccess();
        } else if (paymentIntent.status === "processing" || paymentIntent.status === "requires_action") {
          message.error("Payment failed: The payment was not completed.");
          onCancel(); 
        } else {
          message.warning("Payment status: " + paymentIntent.status);
        }
      }
    } catch {
      message.error("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          background: "#16213e",
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          border: "1px solid rgba(124,58,237,0.1)",
        }}
      >
        <PaymentElement
          onReady={() => setReady(true)}
          options={{
            layout: "tabs",
          }}
        />
        {!ready && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <Spin indicator={<LoadingOutlined style={{ color: "#7c3aed" }} />} />
            <Text style={{ color: "#64748b", display: "block", marginTop: 8 }}>
              Loading payment methods...
            </Text>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <Button
          block
          size="large"
          onClick={onCancel}
          disabled={paying}
          style={{
            borderRadius: 10,
            height: 48,
            borderColor: "rgba(124,58,237,0.3)",
            color: "#94a3b8",
            background: "transparent",
          }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          block
          size="large"
          loading={paying}
          disabled={!stripe || !elements || !ready}
          icon={<CreditCardOutlined />}
          style={{
            borderRadius: 10,
            height: 48,
            fontWeight: 600,
            background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
            border: "none",
          }}
        >
          Pay Now
        </Button>
      </div>
    </form>
  );
}

/* ─── Cart Item Card ───────────────────────────────────────── */

function CartItemCard({
  item,
  onRemove,
  removing,
}: {
  item: CartItem;
  onRemove: (gameId: number) => void;
  removing: boolean;
}) {
  return (
    <Card
      style={{
        background: "#1a1a2e",
        border: "1px solid rgba(124,58,237,0.12)",
        borderRadius: 16,
        overflow: "hidden",
        transition: "all 0.3s ease",
        opacity: removing ? 0.5 : 1,
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {/* Game image */}
        <div
          style={{
            width: 120,
            minHeight: 100,
            flexShrink: 0,
            background: item.game.image_url
              ? `url(${item.game.image_url}) center/cover no-repeat`
              : "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {!item.game.image_url && (
            <ThunderboltOutlined
              style={{ fontSize: 28, color: "rgba(124,58,237,0.4)" }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, transparent 60%, rgba(26,26,46,0.8) 100%)",
            }}
          />
        </div>

        {/* Game info */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Tag
            color={platformColors[item.game.platform] ?? "default"}
            style={{ borderRadius: 6, fontSize: 11, margin: 0, width: "fit-content" }}
          >
            {item.game.platform}
          </Tag>
          <Title
            level={5}
            ellipsis
            style={{ margin: 0, color: "#e2e8f0", lineHeight: 1.3, fontSize: 14 }}
          >
            {item.game.title}
          </Title>
          <Paragraph
            ellipsis={{ rows: 1 }}
            style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}
          >
            {item.game.description || "No description available."}
          </Paragraph>
        </div>

        {/* Price & Remove */}
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 8,
            minWidth: 110,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#a78bfa",
            }}
          >
            ฿{item.game.price.toLocaleString()}
          </Text>
          <Popconfirm
            title="Remove from cart?"
            description="This game will be removed."
            onConfirm={() => onRemove(item.game_id)}
            okText="Remove"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={removing}
              style={{ borderRadius: 8, fontSize: 12 }}
            >
              Remove
            </Button>
          </Popconfirm>
        </div>
      </div>
    </Card>
  );
}

/* ─── Cart Page ────────────────────────────────────────────── */

export default function CartPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Stripe payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/cart");
      const data = res.data as CartResponse;
      setCart(data);
      setCartCount(data.total_items);
    } catch {
      message.error("Failed to load cart. Please login first.");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [message, router]);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    fetchCart();
  }, [fetchCart, router]);

  useEffect(() => {
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) return;

    stripePromise.then((stripe) => {
      if (!stripe) return;
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        if (!paymentIntent) return;

        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        if (paymentIntent.status === "succeeded") {
          message.success("Payment succeeded! 🎉");
          router.push("/orders");
        } else {
          message.error("Payment failed: The payment was not completed.");
          router.push("/orders");
        }
      });
    });
  }, [message, router]);

  const handleRemove = async (gameId: number) => {
    setRemovingId(gameId);
    try {
      await api.delete(`/cart/${gameId}`);
      message.success("Removed from cart");
      fetchCart();
    } catch {
      message.error("Failed to remove item");
    } finally {
      setRemovingId(null);
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;
    setCheckingOut(true);
    try {
      const gameIds = cart.items.map((item) => item.game_id);
      const res = await api.post("/checkout", { game_ids: gameIds });
      const secret = res.data.client_secret;
      setClientSecret(secret);
      setPaymentModalOpen(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      message.error(error?.response?.data?.error ?? "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
  };

  const handleClosePayment = () => {
    setPaymentModalOpen(false);
    setClientSecret(null);
    if (paymentSuccess) {
      setPaymentSuccess(false);
      router.push("/orders");
    }
  };

  const items = cart?.items ?? [];
  const hasItems = items.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a" }}>
      <Navbar cartCount={cartCount} onCartCountChange={setCartCount} />

      {/* Subtle top glow */}
      <div
        style={{
          position: "relative",
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)",
        }}
      >
        {/* Header */}
        <div
          style={{
            maxWidth: 880,
            margin: "0 auto",
            padding: "32px 24px 0",
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              style={{ color: "#94a3b8", marginBottom: 12, padding: "4px 0" }}
            >
              Back to Shop
            </Button>
          </Link>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <ShoppingCartOutlined style={{ fontSize: 26, color: "#7c3aed" }} />
            <Title
              level={3}
              style={{
                margin: 0,
                color: "#e2e8f0",
                fontWeight: 700,
                letterSpacing: "-0.5px",
              }}
            >
              Your Cart
            </Title>
            {hasItems && (
              <Tag
                style={{
                  background: "rgba(124,58,237,0.15)",
                  color: "#a78bfa",
                  border: "none",
                  borderRadius: 20,
                  fontWeight: 600,
                  fontSize: 12,
                  padding: "2px 10px",
                }}
              >
                {items.length} {items.length === 1 ? "item" : "items"}
              </Tag>
            )}
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            maxWidth: 880,
            margin: "0 auto",
            padding: "0 24px 48px",
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <Spin size="large" />
            </div>
          ) : !hasItems ? (
            <div style={{ paddingTop: 60 }}>
              <Empty
                image={
                  <ShoppingOutlined
                    style={{ fontSize: 64, color: "rgba(124,58,237,0.3)" }}
                  />
                }
                description={
                  <Space orientation="vertical" size={8}>
                    <Text style={{ color: "#64748b", fontSize: 16 }}>
                      Your cart is empty
                    </Text>
                    <Text style={{ color: "#475569", fontSize: 14 }}>
                      Browse our collection and find your next adventure!
                    </Text>
                  </Space>
                }
              >
                <Link href="/">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingOutlined />}
                    style={{
                      borderRadius: 10,
                      height: 44,
                      fontWeight: 600,
                      background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                      border: "none",
                      marginTop: 8,
                    }}
                  >
                    Browse Games
                  </Button>
                </Link>
              </Empty>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 24,
                alignItems: "start",
              }}
            >
              {/* Cart items */}
              <div style={{ flex: "1 1 500px", minWidth: 0 }}>
                <Space orientation="vertical" style={{ width: "100%" }} size={10}>
                  {items.map((item) => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      onRemove={handleRemove}
                      removing={removingId === item.game_id}
                    />
                  ))}
                </Space>
              </div>

              {/* Order summary sidebar */}
              <Card
                style={{
                  flex: "0 0 300px",
                  background: "#1a1a2e",
                  border: "1px solid rgba(124,58,237,0.15)",
                  borderRadius: 16,
                  position: "sticky",
                  top: 80,
                  width: "100%",
                }}
                styles={{ body: { padding: "20px" } }}
              >
                <Title
                  level={5}
                  style={{ margin: 0, color: "#e2e8f0", marginBottom: 16 }}
                >
                  Order Summary
                </Title>

                <Space
                  orientation="vertical"
                  style={{ width: "100%" }}
                  size={10}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ color: "#94a3b8", fontSize: 13 }}>
                      Items ({items.length})
                    </Text>
                    <Text style={{ color: "#e2e8f0", fontSize: 13 }}>
                      ฿{(cart?.total_amount ?? 0).toLocaleString()}
                    </Text>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ color: "#94a3b8", fontSize: 13 }}>
                      Delivery
                    </Text>
                    <Text style={{ color: "#22c55e", fontWeight: 600, fontSize: 13 }}>
                      Instant
                    </Text>
                  </div>
                </Space>

                <Divider
                  style={{
                    borderColor: "rgba(124,58,237,0.15)",
                    margin: "16px 0",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 20,
                  }}
                >
                  <Text
                    style={{
                      color: "#e2e8f0",
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    Total
                  </Text>
                  <Text
                    style={{
                      color: "#a78bfa",
                      fontSize: 22,
                      fontWeight: 700,
                    }}
                  >
                    ฿{(cart?.total_amount ?? 0).toLocaleString()}
                  </Text>
                </div>

                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<CreditCardOutlined />}
                  loading={checkingOut}
                  onClick={handleCheckout}
                  style={{
                    borderRadius: 10,
                    height: 44,
                    fontWeight: 600,
                    fontSize: 14,
                    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                    border: "none",
                  }}
                >
                  Proceed to Checkout
                </Button>

                <Text
                  style={{
                    display: "block",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: 11,
                    marginTop: 10,
                  }}
                >
                  🔒 Secure payment via Stripe
                </Text>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* ─── Stripe Payment Modal ─────────────────────────── */}
      <Modal
        open={paymentModalOpen}
        onCancel={handleClosePayment}
        footer={null}
        closable={!paymentSuccess}
        mask={{ closable: false }}
        centered
        width={480}
        destroyOnHidden
        styles={{
          root: {
            background: "transparent",
          },
          body: {
            background: "#1a1a2e",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 20,
            padding: "32px 28px",
          },
          mask: {
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
          },
        }}
      >
        {paymentSuccess ? (
          <Result
            status="success"
            title={
              <Text style={{ color: "#e2e8f0", fontSize: 20, fontWeight: 700 }}>
                Payment Successful! 🎉
              </Text>
            }
            subTitle={
              <Text style={{ color: "#94a3b8" }}>
                Your game keys are ready. Check your order history.
              </Text>
            }
            extra={
              <Button
                type="primary"
                size="large"
                onClick={handleClosePayment}
                style={{
                  borderRadius: 10,
                  height: 44,
                  fontWeight: 600,
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  border: "none",
                }}
              >
                View My Orders
              </Button>
            }
            style={{ padding: 0 }}
          />
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <Title
                level={4}
                style={{ margin: 0, color: "#e2e8f0", marginBottom: 4 }}
              >
                Complete Payment
              </Title>
              <Text style={{ color: "#94a3b8", fontSize: 13 }}>
                Total: {" "}
                <Text
                  style={{ color: "#a78bfa", fontWeight: 700, fontSize: 16 }}
                >
                  ฿{(cart?.total_amount ?? 0).toLocaleString()}
                </Text>
              </Text>
            </div>

            {clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "night",
                    variables: {
                      colorPrimary: "#7c3aed",
                      colorBackground: "#16213e",
                      colorText: "#e2e8f0",
                      colorDanger: "#ef4444",
                      fontFamily: "'Inter', sans-serif",
                      borderRadius: "10px",
                      spacingUnit: "4px",
                    },
                    rules: {
                      ".Input": {
                        border: "1px solid rgba(124,58,237,0.2)",
                        boxShadow: "none",
                      },
                      ".Input:focus": {
                        border: "1px solid #7c3aed",
                        boxShadow: "0 0 0 1px #7c3aed",
                      },
                      ".Tab": {
                        border: "1px solid rgba(124,58,237,0.15)",
                        backgroundColor: "#16213e",
                      },
                      ".Tab--selected": {
                        border: "1px solid #7c3aed",
                        backgroundColor: "rgba(124,58,237,0.1)",
                      },
                    },
                  },
                }}
              >
                <CheckoutForm
                  onSuccess={handlePaymentSuccess}
                  onCancel={handleClosePayment}
                />
              </Elements>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
