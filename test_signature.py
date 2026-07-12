import hmac
import hashlib

RAZORPAY_SECRET = "zgdjVNbZ7Vd7cfTc6L8M0PA0"

razorpay_order_id = "order_T2niuBI8gfbTUe"
razorpay_payment_id = "pay_test_123456"

generated_signature = hmac.new(
    RAZORPAY_SECRET.encode(),
    f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
    hashlib.sha256,
).hexdigest()

print(generated_signature)