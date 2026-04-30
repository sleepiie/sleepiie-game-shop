package domain

import "time"

type User struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	Email        string    `json:"email" gorm:"unique;not null"`
	PasswordHash string    `json:"-" gorm:"not null"`
	AvatarURL    string    `json:"avatar_url" gorm:"type:text"`
	Role         string    `json:"role" gorm:"default:'user'"`
	CreatedAt    time.Time `json:"created_at"`
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

type UpdateProfileRequest struct {
	AvatarURL       *string `json:"avatar_url"`
	CurrentPassword string  `json:"current_password"`
	NewPassword     string  `json:"new_password"`
}

type UserProfileResponse struct {
	ID        uint      `json:"id"`
	Email     string    `json:"email"`
	AvatarURL string    `json:"avatar_url"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type UserRepository interface {
	Create(user *User) error
	FindByEmail(email string) (*User, error)
	FindByID(id uint) (*User, error)
	Update(user *User) error
}

type AuthService interface {
	Register(req RegisterRequest) error
	Login(req LoginRequest) (string, error) // คืนค่าเป็น JWT Token
	ForgotPassword(req ForgotPasswordRequest) error
	ResetPassword(req ResetPasswordRequest) error
	GetProfile(userID uint) (*UserProfileResponse, error)
	UpdateProfile(userID uint, req UpdateProfileRequest) (*UserProfileResponse, error)
}
