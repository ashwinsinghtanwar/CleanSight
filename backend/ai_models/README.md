# AI models
* `garbage.pt`  — land garbage. YOLO11m, single class "garbage", 640 px. Source: github.com/Pravesh-21/Garbage_Detection_System (check that repo's licence before public/commercial use).
* `waterlogging.pt` — waterlogging. YOLO26n (only its *waterlogging* class is used), 512 px + test-time augmentation. Source: github.com/Tripti116/RoadGuard-AI-Hazard-Detection (no licence file published).

Replace either file with your own weights of the same name. Paths, image sizes and thresholds live in `backend/app/config.py`.
Every detection must reach **at least 40 % confidence** (`MIN_CONF`); `GARBAGE_CONF` / `WATERLOGGING_CONF` in `backend\.env` can only raise it.
