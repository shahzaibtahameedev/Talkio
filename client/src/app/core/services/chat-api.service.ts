import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { SEND_MESSAGE_ENDPOINT } from "../constants/api.constants";
import type { ChatId, SendMessageRequest, SendMessageResponse } from "../models/chat.model";

@Injectable({ providedIn: "root" })
export class ChatApiService {
    private readonly httpClient = inject(HttpClient);

    async sendMessage(chatId: ChatId, text: string): Promise<SendMessageResponse> {
        const requestBody: SendMessageRequest = { chatId, text };
        const request = this.httpClient.post<SendMessageResponse>(SEND_MESSAGE_ENDPOINT, requestBody);
        const response = await firstValueFrom(request);

        return response;
    }
}
