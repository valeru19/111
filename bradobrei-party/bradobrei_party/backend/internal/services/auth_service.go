package services

import (
	"errors"
	"os"
	"time"

	"bradobrei/backend/internal/dto"
	"bradobrei/backend/internal/middleware"
	"bradobrei/backend/internal/models"
	"bradobrei/backend/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService(userRepo *repository.UserRepository) *AuthService {
	return &AuthService{userRepo: userRepo}
}

func (s *AuthService) Register(req dto.RegisterRequest) (*models.User, error) {
	// Роль по умолчанию — CLIENT
	role := req.Role
	if role == "" {
		role = models.RoleClient
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Email — указатель: пустая строка → NULL, не нарушает unique constraint
	var emailPtr *string
	if req.Email != "" {
		emailPtr = &req.Email
	}

	user := &models.User{
		Username:     req.Username,
		PasswordHash: string(hash),
		FullName:     req.FullName,
		Phone:        req.Phone,
		Email:        emailPtr,
		Role:         role,
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *AuthService) Login(req dto.LoginRequest) (*dto.LoginResponse, error) {
	user, err := s.userRepo.GetByUsername(req.Username)
	if err != nil {
		return nil, errors.New("неверный логин или пароль")
	}

	if user.MustSetPassword {
		return nil, errors.New("пароль ещё не задан: используйте «Первый вход сотрудника» на странице авторизации")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("неверный логин или пароль")
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &dto.LoginResponse{Token: token}, nil
}

// ActivateEmployee задаёт первый пароль учётной записи сотрудника, созданной без пароля.
func (s *AuthService) ActivateEmployee(username, password string) (*dto.LoginResponse, error) {
	user, err := s.userRepo.GetByUsernameWithEmployee(username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("учётная запись с таким логином не найдена")
		}
		return nil, err
	}

	if user.Role == models.RoleClient {
		return nil, errors.New("для клиентских учётных записей используйте регистрацию")
	}
	if user.EmployeeProfile == nil {
		return nil, errors.New("для этого логина не найден профиль сотрудника")
	}
	if !user.MustSetPassword {
		return nil, errors.New("пароль для этой учётной записи уже задан — войдите через обычный вход")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	user.PasswordHash = string(hash)
	user.MustSetPassword = false
	if err := s.userRepo.Update(user); err != nil {
		return nil, errors.New("не удалось сохранить пароль")
	}

	return s.Login(dto.LoginRequest{Username: username, Password: password})
}

func (s *AuthService) GetCurrentUser(userID uint) (*models.User, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, errors.New("пользователь не найден")
	}

	return user, nil
}

func (s *AuthService) generateToken(user *models.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")

	claims := middleware.Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
