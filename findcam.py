import cv2
cap = cv2.VideoCapture(1)  # DroidCam index
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    cv2.imshow('DroidCam Feed', frame)
    if cv2.waitKey(1) == ord('q'):
        break
cap.release()
cv2.destroyAllWindows()