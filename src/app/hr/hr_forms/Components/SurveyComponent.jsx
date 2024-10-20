import React, { useEffect, useMemo } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/defaultV2.min.css";
import { json } from "./json";
import { FlatLight } from "survey-core/themes";

function SurveyComponent({ surveyData }) {
  const survey = useMemo(() => {
    const model = new Model(json);

    // Make all pages except the first one read-only
    model.pages.forEach((page, index) => {
      if (index > 0) {
        page.questions.forEach((question) => {
          question.readOnly = true;
        });
      }
    });

    return model;
  }, []);

  useEffect(() => {
    if (surveyData) {
      survey.data = surveyData;
    }
  }, [survey, surveyData]);

  survey.applyTheme(FlatLight);

  return (
    <div>
      <div className="mb-4"></div>
      <Survey model={survey} />
    </div>
  );
}

export default SurveyComponent;
