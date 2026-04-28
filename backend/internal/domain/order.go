package domain

import "time"

type Order struct {
	ID            uint        `json:"id" gorm:"primaryKey"`
	UserID        uint        `json:"user_id"`
	TotalAmount   float64     `json:"total_amount"`
	Status        string      `json:"status" gorm:"default:'pending'"` // pending, paid, failed
	PaymentIntent string      `json:"payment_intent" gorm:"unique"`
	CreatedAt     time.Time   `json:"created_at"`
	Items         []OrderItem `json:"items" gorm:"foreignKey:OrderID"`
	Keys          []GameKey   `json:"keys,omitempty" gorm:"foreignKey:OrderID"` // Key ที่ได้หลังจ่ายเงิน
}

type OrderItem struct {
	ID      uint    `json:"id" gorm:"primaryKey"`
	OrderID uint    `json:"order_id"`
	GameID  uint    `json:"game_id"`
	Price   float64 `json:"price"`
}

type CheckoutRequest struct {
	GameIDs []uint `json:"game_ids" binding:"required,min=1"`
}

type OrderKeyResponse struct {
	GameID   uint   `json:"game_id"`
	KeyValue string `json:"key_value"`
}

type OrderHistoryResponse struct {
	ID          uint               `json:"id"`
	TotalAmount float64            `json:"total_amount"`
	Status      string             `json:"status"`
	CreatedAt   time.Time          `json:"created_at"`
	Items       []OrderItem        `json:"items"`
	Keys        []OrderKeyResponse `json:"keys"`
}

type DailyRevenue struct {
	Date    string  `json:"date"`
	Revenue float64 `json:"revenue"`
}

type RevenueSummaryResponse struct {
	TotalRevenue float64        `json:"total_revenue"`
	TotalOrders  int64          `json:"total_orders"`
	DailyRevenue []DailyRevenue `json:"daily_revenue"`
}

type OrderRepository interface {
	CheckStockAndCalculateTotal(gameIDs []uint) (float64, []OrderItem, error)
	CreateOrder(order *Order) error
	GetHistory(userID uint) ([]Order, error)
	ProcessPaymentSuccess(paymentIntentID string) (*Order, error)
	GetAllOrders() ([]Order, error)
	GetRevenueSummary() (float64, int64, []DailyRevenue, error)
	CancelOrder(orderID uint) error
	ProcessPaymentFailure(paymentIntentID string) error
}

type OrderService interface {
	Checkout(userID uint, req CheckoutRequest) (string, error) // Returns payment intent ID / client secret
	GetHistory(userID uint) ([]OrderHistoryResponse, error)
	ProcessPaymentSuccess(paymentIntentID string) error
	GetAllOrders() ([]OrderHistoryResponse, error)
	GetRevenueSummary() (*RevenueSummaryResponse, error)
	CancelOrder(orderID uint) error
	ProcessPaymentFailure(paymentIntentID string) error
}
