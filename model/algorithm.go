package model

import "time"

type Algorithm struct {
	Id             int       `json:"id" gorm:"primaryKey"`
	Name           string    `json:"name" gorm:"type:varchar(128);uniqueIndex;not null"`
	DisplayName    string    `json:"display_name" gorm:"type:varchar(128);not null"`
	Description    string    `json:"description" gorm:"type:text"`
	Category       string    `json:"category" gorm:"type:varchar(128)"`
	Tags           string    `json:"tags" gorm:"type:text"`
	Icon           string    `json:"icon" gorm:"type:varchar(64)"`
	Version        string    `json:"version" gorm:"type:varchar(64)"`
	Enabled        bool      `json:"enabled" gorm:"not null"`
	OpenAPIURL     string    `json:"openapi_url" gorm:"type:text"`
	BaseURL        string    `json:"base_url" gorm:"type:text;not null"`
	OperationID    string    `json:"operation_id" gorm:"type:varchar(255)"`
	Method         string    `json:"method" gorm:"type:varchar(16);not null"`
	Path           string    `json:"path" gorm:"type:text;not null"`
	ContentType    string    `json:"content_type" gorm:"type:varchar(128);not null"`
	RequestSchema  string    `json:"request_schema" gorm:"type:text"`
	TimeoutSeconds int       `json:"timeout_seconds" gorm:"not null"`
	PricingModel   string    `json:"pricing_model" gorm:"type:varchar(160);uniqueIndex;not null"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (Algorithm) TableName() string {
	return "algorithms"
}

func ListAlgorithms(enabledOnly bool) ([]Algorithm, error) {
	algorithms := make([]Algorithm, 0)
	query := DB.Order("id ASC")
	if enabledOnly {
		query = query.Where("enabled = ?", true)
	}
	err := query.Find(&algorithms).Error
	return algorithms, err
}

func GetAlgorithmByID(id int) (*Algorithm, error) {
	var algorithm Algorithm
	if err := DB.First(&algorithm, id).Error; err != nil {
		return nil, err
	}
	return &algorithm, nil
}

func GetEnabledAlgorithmByName(name string) (*Algorithm, error) {
	var algorithm Algorithm
	if err := DB.Where("name = ? AND enabled = ?", name, true).First(&algorithm).Error; err != nil {
		return nil, err
	}
	return &algorithm, nil
}

func CreateAlgorithm(algorithm *Algorithm) error {
	return DB.Create(algorithm).Error
}

func UpdateAlgorithm(algorithm *Algorithm) error {
	return DB.Save(algorithm).Error
}

func DeleteAlgorithm(id int) error {
	return DB.Delete(&Algorithm{}, id).Error
}
