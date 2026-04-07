package handlers

import (
	"net/http"
	"time"

	"bradobrei/backend/internal/dto"
	"bradobrei/backend/internal/models"
	reportspkg "bradobrei/backend/internal/reports"
	"bradobrei/backend/internal/repository"
	"bradobrei/backend/internal/services"

	"github.com/gin-gonic/gin"
)

type ReportFileHandler struct {
	reportService *services.ReportService
	renderer      *reportspkg.Renderer
}

func NewReportFileHandler(reportService *services.ReportService, renderer *reportspkg.Renderer) *ReportFileHandler {
	return &ReportFileHandler{reportService: reportService, renderer: renderer}
}

func (h *ReportFileHandler) ensureRenderer(c *gin.Context, kind string) bool {
	if h.renderer != nil {
		return true
	}

	c.JSON(http.StatusServiceUnavailable, dto.ErrorResponse{
		Error:   "service_unavailable",
		Code:    503,
		Message: kind + " renderer is not configured",
	})
	return false
}

func writeHTML(c *gin.Context, htmlBytes []byte, err error) bool {
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "html_generation_failed",
			Code:    500,
			Message: err.Error(),
		})
		return false
	}

	c.Data(http.StatusOK, "text/html; charset=utf-8", htmlBytes)
	return true
}

func writePDF(c *gin.Context, filename string, pdfBytes []byte, err error) bool {
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{
			Error:   "pdf_generation_failed",
			Code:    500,
			Message: err.Error(),
		})
		return false
	}

	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", `inline; filename="`+filename+`"`)
	c.Header("Cache-Control", "no-store")
	c.Data(http.StatusOK, "application/pdf", pdfBytes)
	return true
}

func buildEmployeeRegistryDocument(users []models.User) models.EmployeeRegistryReportDocument {
	rows := make([]models.EmployeeRegistryReportRow, 0, len(users))
	for _, user := range users {
		var email string
		var specialization string
		var expectedSalary float64
		salons := make([]string, 0)

		if user.Email != nil {
			email = *user.Email
		}

		if user.EmployeeProfile != nil {
			specialization = user.EmployeeProfile.Specialization
			expectedSalary = user.EmployeeProfile.ExpectedSalary
			for _, salon := range user.EmployeeProfile.Salons {
				salons = append(salons, salon.Address)
			}
		}

		rows = append(rows, models.EmployeeRegistryReportRow{
			FullName:       user.FullName,
			Role:           user.Role,
			Phone:          user.Phone,
			Email:          email,
			Specialization: specialization,
			Salons:         salons,
			ExpectedSalary: expectedSalary,
		})
	}

	return models.EmployeeRegistryReportDocument{
		Meta: models.ReportMeta{
			ReportCode:   "2.2.1",
			Title:        "Реестр персонала",
			Subtitle:     "Файловая выгрузка по сотрудникам сети",
			GeneratedAt:  time.Now(),
			Organization: "Bradobrei Party",
		},
		Rows: rows,
	}
}

func buildSalonActivityDocument(from, to time.Time, rows []repository.SalonActivityRow) models.SalonActivityReportDocument {
	periodFrom := from
	periodTo := to
	docRows := make([]models.SalonActivityReportRow, 0, len(rows))
	for _, row := range rows {
		docRows = append(docRows, models.SalonActivityReportRow{
			SalonID:      row.SalonID,
			Address:      row.Address,
			ClientCount:  row.ClientCount,
			ServiceCount: row.ServiceCount,
			TotalRevenue: row.TotalRevenue,
		})
	}

	return models.SalonActivityReportDocument{
		Meta: models.ReportMeta{
			ReportCode:   "2.2.2",
			Title:        "Аналитический отчёт об операционной активности филиалов",
			Subtitle:     "Файловая выгрузка по филиалам за выбранный период",
			GeneratedAt:  time.Now(),
			PeriodFrom:   &periodFrom,
			PeriodTo:     &periodTo,
			Organization: "Bradobrei Party",
		},
		Rows: docRows,
	}
}

func buildServicePopularityDocument(from, to time.Time, rows []repository.ServicePopularityRow) models.ServicePopularityReportDocument {
	periodFrom := from
	periodTo := to
	docRows := make([]models.ServicePopularityReportRow, 0, len(rows))
	for _, row := range rows {
		docRows = append(docRows, models.ServicePopularityReportRow{
			ServiceID:    row.ServiceID,
			ServiceName:  row.ServiceName,
			UsageCount:   row.UsageCount,
			RelativeFreq: row.RelativeFreq,
		})
	}

	return models.ServicePopularityReportDocument{
		Meta: models.ReportMeta{
			ReportCode:   "2.2.3",
			Title:        "Статистика востребованности услуг",
			Subtitle:     "Файловая выгрузка по услугам за выбранный период",
			GeneratedAt:  time.Now(),
			PeriodFrom:   &periodFrom,
			PeriodTo:     &periodTo,
			Organization: "Bradobrei Party",
		},
		Rows: docRows,
	}
}

func buildMasterActivityDocument(from, to time.Time, rows []repository.MasterActivityRow) models.MasterActivityReportDocument {
	periodFrom := from
	periodTo := to
	docRows := make([]models.MasterActivityReportRow, 0, len(rows))
	for _, row := range rows {
		docRows = append(docRows, models.MasterActivityReportRow{
			MasterID:     row.MasterID,
			FullName:     row.FullName,
			ServiceCount: row.ServiceCount,
			Revenue:      row.Revenue,
			MaterialCost: row.MaterialCost,
		})
	}

	return models.MasterActivityReportDocument{
		Meta: models.ReportMeta{
			ReportCode:   "2.2.4",
			Title:        "Аналитический отчёт по активности мастеров",
			Subtitle:     "Файловая выгрузка по мастерам за выбранный период",
			GeneratedAt:  time.Now(),
			PeriodFrom:   &periodFrom,
			PeriodTo:     &periodTo,
			Organization: "Bradobrei Party",
		},
		Rows: docRows,
	}
}

func buildReviewsDocument(from, to time.Time, reviews []models.Review) models.ReviewsReportDocument {
	periodFrom := from
	periodTo := to
	rows := make([]models.ReviewsReportRow, 0, len(reviews))
	for _, review := range reviews {
		author := "Не указан"
		if review.User.FullName != "" {
			author = review.User.FullName
		}

		rows = append(rows, models.ReviewsReportRow{
			Author:    author,
			Rating:    review.Rating,
			Text:      review.Text,
			CreatedAt: review.CreatedAt,
		})
	}

	return models.ReviewsReportDocument{
		Meta: models.ReportMeta{
			ReportCode:   "2.2.5",
			Title:        "Мониторинг качества обслуживания и обратной связи",
			Subtitle:     "Файловая выгрузка отзывов за выбранный период",
			GeneratedAt:  time.Now(),
			PeriodFrom:   &periodFrom,
			PeriodTo:     &periodTo,
			Organization: "Bradobrei Party",
		},
		Rows: rows,
	}
}

func buildInventoryMovementDocument(from, to time.Time, rows []repository.InventoryMovementRow) models.InventoryMovementReportDocument {
	periodFrom := from
	periodTo := to
	docRows := make([]models.InventoryMovementReportRow, 0, len(rows))
	for _, row := range rows {
		docRows = append(docRows, models.InventoryMovementReportRow{
			SalonAddress:   row.SalonAddress,
			MaterialName:   row.MaterialName,
			Unit:           row.Unit,
			OpeningBalance: row.OpeningBalance,
			Purchased:      row.Purchased,
			WrittenOff:     row.WrittenOff,
			CurrentBalance: row.CurrentBalance,
		})
	}

	return models.InventoryMovementReportDocument{
		Meta: models.ReportMeta{
			ReportCode:   "2.2.6",
			Title:        "Ведомость движения ТМЦ",
			Subtitle:     "Файловая выгрузка по складским движениям за выбранный период",
			GeneratedAt:  time.Now(),
			PeriodFrom:   &periodFrom,
			PeriodTo:     &periodTo,
			Organization: "Bradobrei Party",
		},
		Rows: docRows,
	}
}

func buildClientLoyaltyDocument(from, to time.Time, rows []repository.ClientLoyaltyRow) models.ClientLoyaltyReportDocument {
	periodFrom := from
	periodTo := to
	docRows := make([]models.ClientLoyaltyReportRow, 0, len(rows))
	for _, row := range rows {
		docRows = append(docRows, models.ClientLoyaltyReportRow{
			ClientID:    row.ClientID,
			FullName:    row.FullName,
			Phone:       row.Phone,
			Email:       row.Email,
			FirstVisit:  row.FirstVisit,
			LastVisit:   row.LastVisit,
			VisitCount:  row.VisitCount,
			PaidTotal:   row.PaidTotal,
			BonusStatus: row.BonusStatus,
		})
	}

	return models.ClientLoyaltyReportDocument{
		Meta: models.ReportMeta{
			ReportCode:   "2.2.7",
			Title:        "Анализ клиентской лояльности",
			Subtitle:     "Файловая выгрузка по клиентам за выбранный период",
			GeneratedAt:  time.Now(),
			PeriodFrom:   &periodFrom,
			PeriodTo:     &periodTo,
			Organization: "Bradobrei Party",
		},
		Rows: docRows,
	}
}

func buildCancelledBookingsDocument(from, to time.Time, rows []repository.CancelledBookingRow) models.CancelledBookingsReportDocument {
	periodFrom := from
	periodTo := to
	docRows := make([]models.CancelledBookingsReportRow, 0, len(rows))
	for _, row := range rows {
		docRows = append(docRows, models.CancelledBookingsReportRow{
			BookingID:           row.BookingID,
			PlannedVisit:        row.PlannedVisit,
			ClientFullName:      row.ClientFullName,
			MasterFullName:      row.MasterFullName,
			CancellationReason:  row.CancellationReason,
			CancellationRatePct: row.CancellationRatePct,
			Status:              row.Status,
		})
	}

	return models.CancelledBookingsReportDocument{
		Meta: models.ReportMeta{
			ReportCode:   "2.2.8",
			Title:        "Отменённые и нереализованные бронирования",
			Subtitle:     "Файловая выгрузка по отменам за выбранный период",
			GeneratedAt:  time.Now(),
			PeriodFrom:   &periodFrom,
			PeriodTo:     &periodTo,
			Organization: "Bradobrei Party",
		},
		Rows: docRows,
	}
}

func buildFinancialSummaryDocument(from, to time.Time, rows []repository.FinancialSummaryRow) models.FinancialSummaryReportDocument {
	periodFrom := from
	periodTo := to
	docRows := make([]models.FinancialSummaryReportRow, 0, len(rows))
	for _, row := range rows {
		docRows = append(docRows, models.FinancialSummaryReportRow{
			SalonAddress:    row.SalonAddress,
			ExpenseItem:     row.ExpenseItem,
			Amount:          row.Amount,
			TransactionDate: row.TransactionDate,
			TotalBalance:    row.TotalBalance,
		})
	}

	return models.FinancialSummaryReportDocument{
		Meta: models.ReportMeta{
			ReportCode:   "2.2.9",
			Title:        "Финансовый отчёт по транзакциям",
			Subtitle:     "Файловая выгрузка по финансовым операциям за выбранный период",
			GeneratedAt:  time.Now(),
			PeriodFrom:   &periodFrom,
			PeriodTo:     &periodTo,
			Organization: "Bradobrei Party",
		},
		Rows: docRows,
	}
}

// EmployeesHTML godoc
// @Summary HTML отчёт 2.2.1 Реестр персонала
// @Tags reports
// @Produce html
// @Security BearerAuth
// @Success 200 {string} string
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/employees/html [get]
func (h *ReportFileHandler) EmployeesHTML(c *gin.Context) {
	if !h.ensureRenderer(c, "HTML") {
		return
	}

	users, err := h.reportService.GetEmployeeList()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	htmlBytes, renderErr := h.renderer.RenderEmployeesHTML(buildEmployeeRegistryDocument(users))
	writeHTML(c, htmlBytes, renderErr)
}

// EmployeesPDF godoc
// @Summary PDF отчёт 2.2.1 Реестр персонала
// @Tags reports
// @Produce application/pdf
// @Security BearerAuth
// @Success 200 {file} binary
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/employees/pdf [get]
func (h *ReportFileHandler) EmployeesPDF(c *gin.Context) {
	if !h.ensureRenderer(c, "PDF") {
		return
	}

	users, err := h.reportService.GetEmployeeList()
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	pdfBytes, renderErr := h.renderer.RenderEmployeesPDF(c.Request.Context(), buildEmployeeRegistryDocument(users))
	writePDF(c, "employees-report.pdf", pdfBytes, renderErr)
}

// SalonActivityHTML godoc
// @Summary HTML отчёт 2.2.2 Активность филиалов
// @Tags reports
// @Produce html
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Success 200 {string} string
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/salon-activity/html [get]
func (h *ReportFileHandler) SalonActivityHTML(c *gin.Context) {
	if !h.ensureRenderer(c, "HTML") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	rows, err := h.reportService.GetSalonActivity(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	htmlBytes, renderErr := h.renderer.RenderSalonActivityHTML(buildSalonActivityDocument(from, to, rows))
	writeHTML(c, htmlBytes, renderErr)
}

// SalonActivityPDF godoc
// @Summary PDF отчёт 2.2.2 Активность филиалов
// @Tags reports
// @Produce application/pdf
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Success 200 {file} binary
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/salon-activity/pdf [get]
func (h *ReportFileHandler) SalonActivityPDF(c *gin.Context) {
	if !h.ensureRenderer(c, "PDF") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	rows, err := h.reportService.GetSalonActivity(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	pdfBytes, renderErr := h.renderer.RenderSalonActivityPDF(c.Request.Context(), buildSalonActivityDocument(from, to, rows))
	writePDF(c, "salon-activity-report.pdf", pdfBytes, renderErr)
}

// ServicePopularityHTML godoc
// @Summary HTML отчёт 2.2.3 Популярность услуг
// @Tags reports
// @Produce html
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Success 200 {string} string
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/service-popularity/html [get]
func (h *ReportFileHandler) ServicePopularityHTML(c *gin.Context) {
	if !h.ensureRenderer(c, "HTML") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	rows, err := h.reportService.GetServicePopularity(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	htmlBytes, renderErr := h.renderer.RenderServicePopularityHTML(buildServicePopularityDocument(from, to, rows))
	writeHTML(c, htmlBytes, renderErr)
}

// ServicePopularityPDF godoc
// @Summary PDF отчёт 2.2.3 Популярность услуг
// @Tags reports
// @Produce application/pdf
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Success 200 {file} binary
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/service-popularity/pdf [get]
func (h *ReportFileHandler) ServicePopularityPDF(c *gin.Context) {
	if !h.ensureRenderer(c, "PDF") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	rows, err := h.reportService.GetServicePopularity(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	pdfBytes, renderErr := h.renderer.RenderServicePopularityPDF(c.Request.Context(), buildServicePopularityDocument(from, to, rows))
	writePDF(c, "service-popularity-report.pdf", pdfBytes, renderErr)
}

// MasterActivityHTML godoc
// @Summary HTML отчёт 2.2.4 Активность мастеров
// @Tags reports
// @Produce html
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Success 200 {string} string
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/master-activity/html [get]
func (h *ReportFileHandler) MasterActivityHTML(c *gin.Context) {
	if !h.ensureRenderer(c, "HTML") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	rows, err := h.reportService.GetMasterActivity(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	htmlBytes, renderErr := h.renderer.RenderMasterActivityHTML(buildMasterActivityDocument(from, to, rows))
	writeHTML(c, htmlBytes, renderErr)
}

// MasterActivityPDF godoc
// @Summary PDF отчёт 2.2.4 Активность мастеров
// @Tags reports
// @Produce application/pdf
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Success 200 {file} binary
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/master-activity/pdf [get]
func (h *ReportFileHandler) MasterActivityPDF(c *gin.Context) {
	if !h.ensureRenderer(c, "PDF") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	rows, err := h.reportService.GetMasterActivity(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	pdfBytes, renderErr := h.renderer.RenderMasterActivityPDF(c.Request.Context(), buildMasterActivityDocument(from, to, rows))
	writePDF(c, "master-activity-report.pdf", pdfBytes, renderErr)
}

// ReviewsHTML godoc
// @Summary HTML отчёт 2.2.5 Отзывы
// @Tags reports
// @Produce html
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Success 200 {string} string
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/reviews/html [get]
func (h *ReportFileHandler) ReviewsHTML(c *gin.Context) {
	if !h.ensureRenderer(c, "HTML") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	reviews, err := h.reportService.GetReviews(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	htmlBytes, renderErr := h.renderer.RenderReviewsHTML(buildReviewsDocument(from, to, reviews))
	writeHTML(c, htmlBytes, renderErr)
}

// ReviewsPDF godoc
// @Summary PDF отчёт 2.2.5 Отзывы
// @Tags reports
// @Produce application/pdf
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Success 200 {file} binary
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/reviews/pdf [get]
func (h *ReportFileHandler) ReviewsPDF(c *gin.Context) {
	if !h.ensureRenderer(c, "PDF") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	reviews, err := h.reportService.GetReviews(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	pdfBytes, renderErr := h.renderer.RenderReviewsPDF(c.Request.Context(), buildReviewsDocument(from, to, reviews))
	writePDF(c, "reviews-report.pdf", pdfBytes, renderErr)
}

// InventoryMovementHTML godoc
// @Summary HTML отчёт 2.2.6 Движение ТМЦ
// @Tags reports
// @Produce html
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Param salon_id query int false "ID салона"
// @Success 200 {string} string
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/inventory-movement/html [get]
func (h *ReportFileHandler) InventoryMovementHTML(c *gin.Context) {
	if !h.ensureRenderer(c, "HTML") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	salonID, err := parseOptionalUintQuery(c, "salon_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "salon_id должен быть целым числом"})
		return
	}

	rows, err := h.reportService.GetInventoryMovement(from, to, salonID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	htmlBytes, renderErr := h.renderer.RenderInventoryMovementHTML(buildInventoryMovementDocument(from, to, rows))
	writeHTML(c, htmlBytes, renderErr)
}

// InventoryMovementPDF godoc
// @Summary PDF отчёт 2.2.6 Движение ТМЦ
// @Tags reports
// @Produce application/pdf
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Param salon_id query int false "ID салона"
// @Success 200 {file} binary
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/inventory-movement/pdf [get]
func (h *ReportFileHandler) InventoryMovementPDF(c *gin.Context) {
	if !h.ensureRenderer(c, "PDF") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	salonID, err := parseOptionalUintQuery(c, "salon_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "salon_id должен быть целым числом"})
		return
	}

	rows, err := h.reportService.GetInventoryMovement(from, to, salonID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	pdfBytes, renderErr := h.renderer.RenderInventoryMovementPDF(c.Request.Context(), buildInventoryMovementDocument(from, to, rows))
	writePDF(c, "inventory-movement-report.pdf", pdfBytes, renderErr)
}

// ClientLoyaltyHTML godoc
// @Summary HTML отчёт 2.2.7 Клиентская лояльность
// @Tags reports
// @Produce html
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Success 200 {string} string
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/client-loyalty/html [get]
func (h *ReportFileHandler) ClientLoyaltyHTML(c *gin.Context) {
	if !h.ensureRenderer(c, "HTML") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	rows, err := h.reportService.GetClientLoyalty(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	htmlBytes, renderErr := h.renderer.RenderClientLoyaltyHTML(buildClientLoyaltyDocument(from, to, rows))
	writeHTML(c, htmlBytes, renderErr)
}

// ClientLoyaltyPDF godoc
// @Summary PDF отчёт 2.2.7 Клиентская лояльность
// @Tags reports
// @Produce application/pdf
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Success 200 {file} binary
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/client-loyalty/pdf [get]
func (h *ReportFileHandler) ClientLoyaltyPDF(c *gin.Context) {
	if !h.ensureRenderer(c, "PDF") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	rows, err := h.reportService.GetClientLoyalty(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	pdfBytes, renderErr := h.renderer.RenderClientLoyaltyPDF(c.Request.Context(), buildClientLoyaltyDocument(from, to, rows))
	writePDF(c, "client-loyalty-report.pdf", pdfBytes, renderErr)
}

// CancelledBookingsHTML godoc
// @Summary HTML отчёт 2.2.8 Отменённые бронирования
// @Tags reports
// @Produce html
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Success 200 {string} string
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/cancelled-bookings/html [get]
func (h *ReportFileHandler) CancelledBookingsHTML(c *gin.Context) {
	if !h.ensureRenderer(c, "HTML") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	rows, err := h.reportService.GetCancelledBookings(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	htmlBytes, renderErr := h.renderer.RenderCancelledBookingsHTML(buildCancelledBookingsDocument(from, to, rows))
	writeHTML(c, htmlBytes, renderErr)
}

// CancelledBookingsPDF godoc
// @Summary PDF отчёт 2.2.8 Отменённые бронирования
// @Tags reports
// @Produce application/pdf
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Success 200 {file} binary
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/cancelled-bookings/pdf [get]
func (h *ReportFileHandler) CancelledBookingsPDF(c *gin.Context) {
	if !h.ensureRenderer(c, "PDF") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	rows, err := h.reportService.GetCancelledBookings(from, to)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	pdfBytes, renderErr := h.renderer.RenderCancelledBookingsPDF(c.Request.Context(), buildCancelledBookingsDocument(from, to, rows))
	writePDF(c, "cancelled-bookings-report.pdf", pdfBytes, renderErr)
}

// FinancialSummaryHTML godoc
// @Summary HTML отчёт 2.2.9 Финансовая сводка
// @Tags reports
// @Produce html
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Param salon_id query int false "ID салона"
// @Success 200 {string} string
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/financial-summary/html [get]
func (h *ReportFileHandler) FinancialSummaryHTML(c *gin.Context) {
	if !h.ensureRenderer(c, "HTML") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	salonID, err := parseOptionalUintQuery(c, "salon_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "salon_id должен быть целым числом"})
		return
	}

	rows, err := h.reportService.GetFinancialSummary(from, to, salonID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	htmlBytes, renderErr := h.renderer.RenderFinancialSummaryHTML(buildFinancialSummaryDocument(from, to, rows))
	writeHTML(c, htmlBytes, renderErr)
}

// FinancialSummaryPDF godoc
// @Summary PDF отчёт 2.2.9 Финансовая сводка
// @Tags reports
// @Produce application/pdf
// @Security BearerAuth
// @Param from query string false "Начало периода YYYY-MM-DD"
// @Param to query string false "Конец периода YYYY-MM-DD"
// @Param salon_id query int false "ID салона"
// @Success 200 {file} binary
// @Failure 400 {object} dto.ErrorResponse
// @Failure 500 {object} dto.ErrorResponse
// @Failure 503 {object} dto.ErrorResponse
// @Router /reports/financial-summary/pdf [get]
func (h *ReportFileHandler) FinancialSummaryPDF(c *gin.Context) {
	if !h.ensureRenderer(c, "PDF") {
		return
	}

	from, to, err := parsePeriod(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "Формат даты: YYYY-MM-DD"})
		return
	}

	salonID, err := parseOptionalUintQuery(c, "salon_id")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "bad_request", Code: 400, Message: "salon_id должен быть целым числом"})
		return
	}

	rows, err := h.reportService.GetFinancialSummary(from, to, salonID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "internal", Code: 500})
		return
	}

	pdfBytes, renderErr := h.renderer.RenderFinancialSummaryPDF(c.Request.Context(), buildFinancialSummaryDocument(from, to, rows))
	writePDF(c, "financial-summary-report.pdf", pdfBytes, renderErr)
}
