/**
 * Created by rbhatnagar on 4/20/2018.
 */

'use strict';
const debug = require('debug')('app:transform-data');
const _ = require('lodash');
module.exports = {
    hraQandA,
    hraResponse,
    behaviorResponse
};
function hraQandA(body) {
    const resultJson = {};
    resultJson.SurveyId = body.SurveyId;
    resultJson.LastCompletedDate = body.LastCompletedDate;
    resultJson.CurrentMemberHraResponse = [];
    let i = 0;
    _.each(body.Categories, (obj) => {
        _.each(obj.Questions, (obj2) => {
            const questionText = [];
            const answerText = [];
            i = i + 1;
            questionText.push(`Question#: ${i}`);
            //questionText.push(obj.CategoryId);
            questionText.push(obj2.QuestionText);
            _.each(obj2.Answers, (ans) => {
                answerText.push(ans.AnswerText);
            });
            questionText.push(answerText);
            resultJson.CurrentMemberHraResponse.push(questionText);
        });
    });
    return resultJson;
}
function hraResponse(body) {
    const resultJson = {};
    resultJson.SurveyId = body.SurveyId;
    resultJson.LastCompletedDate = body.LastCompletedDate;
    resultJson.CurrentMemberHraResponse = [];
    _.each(body.Categories, (obj) => {
        _.each(obj.Questions, (obj2) => {
            _.each(obj2.Answers, (ans) => {
                if (ans.CurrentMemberHraResponse.ResponseText) {
                    resultJson.CurrentMemberHraResponse.push(ans.CurrentMemberHraResponse);
                }
            });
        });
    });
    return resultJson;
}
function behaviorResponse(body) {
    const resultJson = {};
    resultJson.Goals = [];
    _.each(body, (val) => {
        if (_.isEqual('ACTIVE', val.MemberStatus)) {
            /*resultJson.BehaviorId = val.BehaviorId;
             resultJson.Title = val.Title;
             resultJson.BehaviorType = val.BehaviorType;
             resultJson.Descripton = val.Descripton;
             resultJson.ImageName = val.ImageName;
             resultJson.VOWMessage = val.VOWMessage;
             resultJson.MemberStatus = val.MemberStatus;
             resultJson.DefaultBehavior = val.DefaultBehavior;
             resultJson.BehaviorProgress = val.BehaviorProgress;
             resultJson.BehaviorStartDate = val.BehaviorStartDate;
             resultJson.BehaviorLastUpdatedDate = val.BehaviorLastUpdatedDate;
             resultJson.Source = val.Source;*/
            _.each(val.Goals, (goal) => {
                if (_.isEqual('ACTIVE', goal.GoalStatus)) {
                    resultJson.Goals.push(goal);
                }
            });
        }
    });
    return resultJson;
}
