package hostmonitor

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"strings"

	"github.com/QuantumNous/new-api/common"
)

const privateKeyCiphertextPrefix = "v1:"

func privateKeyCipher() (cipher.AEAD, error) {
	key := sha256.Sum256([]byte(common.CryptoSecret))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return nil, err
	}
	return cipher.NewGCM(block)
}

func EncryptPrivateKey(plaintext string) (string, error) {
	if strings.TrimSpace(plaintext) == "" {
		return "", fmt.Errorf("SSH private key is required")
	}
	aead, err := privateKeyCipher()
	if err != nil {
		return "", err
	}
	nonce := make([]byte, aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	ciphertext := aead.Seal(nil, nonce, []byte(plaintext), nil)
	payload := append(nonce, ciphertext...)
	return privateKeyCiphertextPrefix + base64.RawStdEncoding.EncodeToString(payload), nil
}

func DecryptPrivateKey(ciphertext string) (string, error) {
	if !strings.HasPrefix(ciphertext, privateKeyCiphertextPrefix) {
		return "", fmt.Errorf("unsupported SSH private key ciphertext")
	}
	payload, err := base64.RawStdEncoding.DecodeString(strings.TrimPrefix(ciphertext, privateKeyCiphertextPrefix))
	if err != nil {
		return "", fmt.Errorf("decode SSH private key ciphertext: %w", err)
	}
	aead, err := privateKeyCipher()
	if err != nil {
		return "", err
	}
	if len(payload) < aead.NonceSize() {
		return "", fmt.Errorf("invalid SSH private key ciphertext")
	}
	plaintext, err := aead.Open(nil, payload[:aead.NonceSize()], payload[aead.NonceSize():], nil)
	if err != nil {
		return "", fmt.Errorf("decrypt SSH private key: %w", err)
	}
	return string(plaintext), nil
}
