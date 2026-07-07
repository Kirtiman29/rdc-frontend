# Gemini Image-to-Image Frontend Contract

This document describes the frontend flow for the Gemini image-to-image screen and how to update AI credits after a successful response.

## Endpoint

Use the subscription-service endpoint:

```ts
POST ${import.meta.env.VITE_SUBSCRIPTION_SERVICE_URL}/api/gemini-image/image-to-image
```

Supported alias:

```ts
POST ${import.meta.env.VITE_SUBSCRIPTION_SERVICE_URL}/gemini-image/image-to-image
```

Do not call Gemini directly from the browser.

## Request Flow

1. User uploads an image.
2. User types a prompt.
3. User selects a mode: `auto`, `edit`, or `redesign`.
4. Frontend sends a `multipart/form-data` request with the JWT in `Authorization`.
5. Backend builds the final prompt, calls Gemini, and returns the generated image result.
6. Frontend shows preview/download and updates credits from the response.

## Frontend Fields

Recommended multipart fields:

```ts
file: File
prompt: string
mode: "auto" | "edit" | "redesign"
aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4"
num_images?: number
```

Notes:

- `mode` is the preferred field name.
- `edit_mode` is supported by the backend for compatibility.
- `image_size` is not forwarded by the current subscription-service Gemini flow, so do not send it from the frontend yet.
- The backend accepts `file`, `image`, or `input_image` as the image part. Use `file` or `image` consistently.

## Supported Image Types

Allow only:

- `image/png`
- `image/jpeg`
- `image/webp`

The current subscription-service backend rejects `image/heic` and `image/heif`, so convert those on the frontend before upload if needed.

If the backend rejects unsupported files, keep the client-side validation strict to avoid a 400.

## Mode Semantics

`auto`

- Apply the prompt naturally.
- Preserve the main subject.
- Improve quality, lighting, composition, and color only when useful.

`edit`

- Make only the requested changes.
- Preserve the rest of the image unless the prompt explicitly changes it.

`redesign`

- Creatively redesign the image.
- Style, mood, and background can change.
- Preserve the main subject and user intent.

## Example Request

```ts
const formData = new FormData();
formData.append("file", imageFile);
formData.append("prompt", prompt);
formData.append("mode", mode);

if (aspectRatio && aspectRatio !== "auto") {
  formData.append("aspect_ratio", aspectRatio);
}

formData.append("num_images", String(numImages));

const response = await axios.post(
  `${SUBSCRIPTION_BASE_URL}/api/gemini-image/image-to-image`,
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
```

Do not set `Content-Type` manually for `FormData`. Let the browser/axios add the multipart boundary.

## Expected Response

Typical success response:

```ts
{
  success: true,
  output_url?: string,
  image_urls?: string[],
  remaining_credits?: number,
  credits_required?: number,
  final_prompt?: string,
  prompt_enhanced?: boolean,
  fallback_used?: boolean
}
```

If the backend returns absolute URLs, use them directly in `img src`.

If the backend returns a base64 image instead, convert it on the frontend:

```ts
const imageUrl = `data:${mimeType};base64,${imageBase64}`;
```

## Credit Deduction Rule

Credits should update only after a successful backend response.

Recommended frontend behavior:

1. If `remaining_credits` is present, set the local credit balance from it immediately.
2. If the response does not include `remaining_credits`, refresh from `GET /me/credits`.
3. If the app uses a global credit badge, emit the `ai-credits-updated` event with the new credit value.

Example:

```ts
if (response.remaining_credits !== undefined) {
  setAvailableCredits(response.remaining_credits);
}
```

## Error Handling

Show the backend message when available:

```ts
const message =
  err?.response?.data?.message ||
  err?.response?.data?.detail ||
  "Something went wrong";
```

Common failure reasons:

- invalid token
- unsupported image type
- missing prompt
- invalid mode
- insufficient credits

## Frontend Checklist

- Validate image type before upload.
- Validate prompt is not empty.
- Default `mode` to `auto`.
- Send JWT in `Authorization`.
- Use `FormData`.
- Read `remaining_credits` from success responses.
- Refresh credits from `/me/credits` if the response omits them.
