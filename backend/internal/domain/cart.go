package domain

import "time"

type CartItem struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"-" gorm:"not null"`
	GameID    uint      `json:"game_id" gorm:"not null"`
	Game      Game      `json:"game" gorm:"foreignKey:GameID"`
	CreatedAt time.Time `json:"created_at"`
}

type AddToCartRequest struct {
	GameID uint `json:"game_id" binding:"required"`
}

type CartResponse struct {
	Items       []CartItem `json:"items"`
	TotalAmount float64    `json:"total_amount"`
	TotalItems  int        `json:"total_items"`
}

type CartRepository interface {
	AddItem(item *CartItem) error
	GetItemsByUserID(userID uint) ([]CartItem, error)
	GetItemByUserIDAndGameID(userID uint, gameID uint) (*CartItem, error)
	RemoveItem(userID uint, gameID uint) error
	ClearCart(userID uint) error
}

type CartService interface {
	AddItem(userID uint, gameID uint) error
	GetMyCart(userID uint) (CartResponse, error)
	RemoveItem(userID uint, gameID uint) error
	ClearCart(userID uint) error
}
