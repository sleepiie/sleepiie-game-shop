package application

import (
	"errors"
	"os"
	"time"

	"github.com/sleepiie/sleepiie-game-shop/internal/domain"

	"github.com/alexedwards/argon2id"
	"github.com/golang-jwt/jwt/v5"
)

type authService struct {
	repo domain.UserRepository
}

func NewAuthService(repo domain.UserRepository) domain.AuthService {
	return &authService{repo: repo}
}

func (s *authService) Register(req domain.RegisterRequest) error {
	existingUser, _ := s.repo.FindByEmail(req.Email)
	if existingUser != nil {
		return errors.New("email already in use")
	}

	hashedPassword, err := argon2id.CreateHash(req.Password, argon2id.DefaultParams)
	if err != nil {
		return errors.New("failed to hash password")
	}

	user := &domain.User{
		Email:        req.Email,
		PasswordHash: hashedPassword,
		Role:         "user",
	}

	return s.repo.Create(user)
}

func (s *authService) Login(req domain.LoginRequest) (string, error) {
	user, err := s.repo.FindByEmail(req.Email)
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	match, err := argon2id.ComparePasswordAndHash(req.Password, user.PasswordHash)
	if err != nil || !match {
		return "", errors.New("invalid email or password")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	secret := os.Getenv("JWT_SECRET")
	tokenString, err := token.SignedString([]byte(secret))

	return tokenString, err
}
