package application

import (
	"github.com/sleepiie/sleepiie-game-shop/internal/domain"
)

type gameService struct {
	repo domain.GameRepository
}

func NewGameService(repo domain.GameRepository) domain.GameService {
	return &gameService{repo: repo}
}

func (s *gameService) GetGamesList(search string, platform string) ([]domain.GameResponse, error) {
	games, err := s.repo.FindAll(search, platform)
	if err != nil {
		return nil, err
	}

	var responses []domain.GameResponse
	for _, game := range games {

		stock, _ := s.repo.CountAvailableKeys(game.ID)

		responses = append(responses, domain.GameResponse{
			Game:    game,
			InStock: stock,
		})
	}

	return responses, nil
}

func (s *gameService) GetGameByID(id uint) (*domain.GameResponse, error) {
	game, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	stock, _ := s.repo.CountAvailableKeys(game.ID)

	return &domain.GameResponse{
		Game:    *game,
		InStock: stock,
	}, nil
}

func (s *gameService) CreateGame(req domain.CreateGameRequest) (*domain.Game, error) {
	game := &domain.Game{
		Title:       req.Title,
		Description: req.Description,
		Price:       req.Price,
		Platform:    req.Platform,
		ImageURL:    req.ImageURL,
	}

	if err := s.repo.Create(game); err != nil {
		return nil, err
	}

	return game, nil
}

func (s *gameService) DeleteGame(id uint) error {
	return s.repo.Delete(id)
}

func (s *gameService) AddGameKeys(gameID uint, keys []string) error {
	var gameKeys []domain.GameKey
	for _, key := range keys {
		encryptedKey, err := EncryptKey(key)
		if err != nil {
			return err
		}
		gameKeys = append(gameKeys, domain.GameKey{
			GameID:   gameID,
			KeyValue: encryptedKey,
			IsUsed:   false,
		})
	}

	return s.repo.CreateKeys(gameKeys)
}
