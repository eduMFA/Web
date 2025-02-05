'use client'

import {Form} from "@heroui/form";
import {Select, SelectItem} from "@heroui/select";
import {Textarea} from "@heroui/input";
import {FormEvent, useEffect, useState} from "react";
import {useSearchParams} from "next/navigation";
import {Button} from "@heroui/button";
import {NavigationBar} from "@/components/NavigationBar";
import {SharedSelection} from "@heroui/system";
import {useTranslations} from "next-intl";
import {Footer} from "@/components/Footer";


enum FeedbackType {
    Bug = "bug",
    Feature = "feature",
    General = "general",
}

export default function AppFeedback() {
    const t = useTranslations('AppFeedback');
    const searchParams = useSearchParams()

    const [feedbackTypes, setFeedbackTypes] = useState<SharedSelection>(new Set([]));
    const [systemInfo, setSystemInfo] = useState<string>("");

    useEffect(() => {
        if (searchParams.get('systemInfo')) {
            setSystemInfo(searchParams.get('systemInfo') as string);
        }
    }, [searchParams]);

    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (e.currentTarget == null) return

        const data = Object.fromEntries(new FormData(e.currentTarget));

        console.log(data);
    };

  return (
      <main className="flex flex-col min-h-screen bg-gray-100">
          <NavigationBar />

          <div className="flex-grow flex items-center justify-center px-4">
              <div className="bg-white shadow-md rounded-lg p-8 max-w-lg w-full">
                  <h1 className="font-bold text-2xl text-center mb-6">App Feedback</h1>
                  <Form onSubmit={onSubmit} className="space-y-6">
                      {/* Feedback Type */}
                      <Select
                          id="feedbackType"
                          className="w-full"
                          onSelectionChange={setFeedbackTypes}
                          label={t('feedbackTypeLabel')}
                          isRequired
                          autoFocus
                      >
                          {Object.values(FeedbackType).map((feedbackType) => (
                              <SelectItem key={feedbackType}>
                                  {t(feedbackType)}
                              </SelectItem>
                          ))}
                      </Select>

                      {/* Description */}
                      <Textarea
                          id="description"
                          className="w-full"
                          label={t('descriptionLabel')}
                          maxLength={4096}
                          isRequired
                          placeholder={t('descriptionPlaceholder')}
                      />

                      {/* System Info */}
                      <Textarea
                          id="systemInfo"
                          className="w-full"
                          maxLength={1024}
                          value={systemInfo || undefined}
                          disabled={systemInfo.length > 0}
                          label={t('systemInfoLabel')}
                          isRequired
                          placeholder={t('systemInfoPlaceholder')}
                      />

                      {/* Submit Button */}
                      <Button
                          type="submit"
                          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                          {t('submitLabel')}
                      </Button>
                  </Form>
              </div>
          </div>

          <Footer />
      </main>
  );
}