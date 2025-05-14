import cv2
cap = cv2.VideoCapture(1)  # DroidCam index
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    cv2.imshow('Phone Feed', frame)
    if cv2.waitKey(1) == ord('q'):
        break
cap.release()
cv2.destroyAllWindows()

# import cv2

# def test_camera_index(index):
#     cap = cv2.VideoCapture(index)
#     if not cap.isOpened():
#         print(f"Camera index {index} not accessible")
#         return False
#     ret, frame = cap.read()
#     if ret:
#         print(f"Camera found at index {index}")
#         cap.release()
#         return True
#     cap.release()
#     return False

# # Test camera indices (0 to 9, adjust range if needed)
# for i in range(1,9):
#     print(i)
#     if test_camera_index(i):
#         camera_index = i
#         break
# else:
#     print("No camera detected. Check connections or drivers.")
#     exit()

# # Open the camera feed with the detected index
# cap = cv2.VideoCapture(camera_index)

# # Set resolution (optional, Logitech C930 supports up to 1080p)
# cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
# cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)

# while cap.isOpened():
#     ret, frame = cap.read()
#     if not ret:
#         print("Failed to grab frame")
#         break
#     cv2.imshow('Logitech C930 Feed', frame)
#     if cv2.waitKey(1) & 0xFF == ord('q'):
#         break

# cap.release()
# cv2.destroyAllWindows()