package domain

import "time"

type Game struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	Platform    string    `json:"platform"`
	CreatedAt   time.Time `json:"created_at"`
}

type GameKey struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	GameID    uint      `json:"game_id"`
	KeyValue  string    `json:"key_value,omitempty"`
	IsUsed    bool      `json:"is_used"`
	OrderID   *uint     `json:"order_id"`
	CreatedAt time.Time `json:"created_at"`
}

type GameResponse struct {
	Game
	InStock int64 `json:"in_stock"`
}

type GameRepository interface {
	FindAll(search string, platform string) ([]Game, error)
	FindByID(id uint) (*Game, error)
	CountAvailableKeys(gameID uint) (int64, error)
}

type GameService interface {
	GetGamesList(search string, platform string) ([]GameResponse, error)
	GetGameByID(id uint) (*GameResponse, error)
}
