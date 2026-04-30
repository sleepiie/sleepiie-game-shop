package application

import (
	"errors"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/sleepiie/sleepiie-game-shop/internal/domain"

	"github.com/alexedwards/argon2id"
	"github.com/golang-jwt/jwt/v5"
)

type authService struct {
	repo         domain.UserRepository
	emailService EmailService
}

func NewAuthService(repo domain.UserRepository, emailService EmailService) domain.AuthService {
	return &authService{
		repo:         repo,
		emailService: emailService,
	}
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

func (s *authService) ForgotPassword(req domain.ForgotPasswordRequest) error {
	user, err := s.repo.FindByEmail(req.Email)
	if err != nil || user == nil {
		return nil
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"type":    "password_reset",
		"exp":     time.Now().Add(time.Minute * 15).Unix(),
	})

	secret := os.Getenv("JWT_SECRET")
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return errors.New("failed to generate reset token")
	}

	return s.emailService.SendPasswordResetEmail(user.Email, tokenString)
}

func (s *authService) ResetPassword(req domain.ResetPasswordRequest) error {
	secret := os.Getenv("JWT_SECRET")
	token, err := jwt.Parse(req.Token, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return errors.New("invalid or expired reset token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["type"] != "password_reset" {
		return errors.New("invalid token type")
	}

	userID := uint(claims["user_id"].(float64))
	user, err := s.repo.FindByID(userID)
	if err != nil || user == nil {
		return errors.New("user not found")
	}

	hashedPassword, err := argon2id.CreateHash(req.Password, argon2id.DefaultParams)
	if err != nil {
		return errors.New("failed to hash password")
	}

	user.PasswordHash = hashedPassword
	return s.repo.Update(user)
}

func (s *authService) GetProfile(userID uint) (*domain.UserProfileResponse, error) {
	user, err := s.repo.FindByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	return buildUserProfileResponse(user), nil
}

func (s *authService) UpdateProfile(userID uint, req domain.UpdateProfileRequest) (*domain.UserProfileResponse, error) {
	user, err := s.repo.FindByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}

	if req.AvatarURL != nil {
		avatarURL := strings.TrimSpace(*req.AvatarURL)
		if avatarURL != "" {
			parsedURL, err := url.ParseRequestURI(avatarURL)
			if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
				return nil, errors.New("avatar URL must be a valid http or https URL")
			}
		}
		user.AvatarURL = avatarURL
	}

	if req.NewPassword != "" {
		if len(req.NewPassword) < 6 {
			return nil, errors.New("new password must be at least 6 characters")
		}

		if req.CurrentPassword == "" {
			return nil, errors.New("current password is required")
		}

		match, err := argon2id.ComparePasswordAndHash(req.CurrentPassword, user.PasswordHash)
		if err != nil || !match {
			return nil, errors.New("current password is incorrect")
		}

		hashedPassword, err := argon2id.CreateHash(req.NewPassword, argon2id.DefaultParams)
		if err != nil {
			return nil, errors.New("failed to hash password")
		}

		user.PasswordHash = hashedPassword
	}

	if req.AvatarURL == nil && req.NewPassword == "" {
		return buildUserProfileResponse(user), nil
	}

	if err := s.repo.Update(user); err != nil {
		return nil, err
	}

	return buildUserProfileResponse(user), nil
}

func buildUserProfileResponse(user *domain.User) *domain.UserProfileResponse {
	return &domain.UserProfileResponse{
		ID:        user.ID,
		Email:     user.Email,
		AvatarURL: user.AvatarURL,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
	}
}
