package database

import (
	"github.com/sleepiie/sleepiie-game-shop/internal/domain"
	"gorm.io/gorm"
)

type gameRepository struct {
	db *gorm.DB
}

func NewGameRepository(db *gorm.DB) domain.GameRepository {
	return &gameRepository{db: db}
}

func (r *gameRepository) FindAll(search string, platform string) ([]domain.Game, error) {
	var games []domain.Game
	query := r.db.Model(&domain.Game{})

	if search != "" {
		query = query.Where("title ILIKE ?", "%"+search+"%")
	}
	if platform != "" {
		query = query.Where("platform = ?", platform)
	}

	err := query.Find(&games).Error
	return games, err
}

func (r *gameRepository) FindByID(id uint) (*domain.Game, error) {
	var game domain.Game
	err := r.db.First(&game, id).Error
	return &game, err
}

func (r *gameRepository) CountAvailableKeys(gameID uint) (int64, error) {
	var count int64
	err := r.db.Model(&domain.GameKey{}).
		Where("game_id = ? AND is_used = ?", gameID, false).
		Count(&count).Error
	return count, err
}
