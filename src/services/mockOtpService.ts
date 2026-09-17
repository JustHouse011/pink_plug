const otpStore = {
  value: '',
};

const generateOtp = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

export const mockOtpService = {
  async sendOtp(contact: string) {
    const otp = generateOtp();
    otpStore.value = otp;

    return {
      success: true,
      message: `Verification code sent to ${contact}.`,
      otp,
    };
  },

  verifyOtp(input: string, expectedOtp = otpStore.value) {
    const normalizedInput = input.trim();
    const normalizedExpected = expectedOtp.trim();

    return normalizedInput.length === 6 && normalizedInput === normalizedExpected;
  },
};
