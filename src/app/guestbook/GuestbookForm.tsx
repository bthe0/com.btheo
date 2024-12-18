"use client";
import { FormProvider } from "../components/FormProvider";
import Button from "../components/Button";
import AutoFormBuilder from "../components/AutoFormBuilder";
import FormErrors from "../components/FormErrors";
import * as yup from "yup";
import { FiCheckCircle } from "react-icons/fi";
import { useAnalytics } from "../contexts/AnalyticsContext";

export default function GuestbookForm({ createGuestbook }: any) {
  const { y } = useAnalytics();

  const handleSubmit = async (values = {}) => {
    y("CONVERSION", { form: "guestbook-sign", name: values.name });
    return await createGuestbook(values);
  };

  return (
    <div className="mb-xl">
      <FormProvider
        validationSchema={{
          name: {
            rules: [yup.string().required("Name is required")],
          },
          message: {
            rules: [yup.string().required("Message is required")],
          },
          email: {
            rules: [yup.string().email("Invalid email")],
          },
          website: {
            rules: [yup.string().url("Invalid URL")],
          },
        }}
        onSubmit={handleSubmit}
      >
        {({ done, submitForm }) => {
          if (done) {
            return (
              <p className="success col-lg-6 col-sm-12 flex items-center">
                <FiCheckCircle className={"mr-xs"} /> Thanks for signing the
                guestbook!
              </p>
            );
          }

          return (
            <>
              <FormErrors afterSubmit size="col-lg-6" />
              <AutoFormBuilder
                schema={{
                  name: {
                    type: "text",
                    label: "Name *",
                    required: true,
                    autoFocus: true,
                    size: "col-lg-6 col-md-12 col-xs-12",
                    row: 1,
                  },
                  email: {
                    type: "email",
                    label: "Email",
                    size: "col-lg-3 col-md-6 col-xs-12",
                    row: 2,
                  },
                  website: {
                    type: "text",
                    label: "Website",
                    size: "col-lg-3 col-md-6 col-xs-12",
                    row: 2,
                  },
                  message: {
                    type: "textarea",
                    label: "Message *",
                    size: "col-lg-6 col-md-12 col-xs-12",
                    maxLength: 500,
                    row: 4,
                  },
                }}
              />
              <div className="row">
                <div className="col-lg-6 col-md-6 col-xs-12">
                  <div>
                    <Button
                      type="submit"
                      onClick={submitForm}
                      className={"full-width-sm pv-md-2"}
                    >
                      Sign Guestbook
                    </Button>
                  </div>
                </div>
              </div>
            </>
          );
        }}
      </FormProvider>
    </div>
  );
}
