/**
 * Created by RBhatnagar on 12/24/2018.
 */

'use strict';
const _ = require('lodash');
const debug = require('debug')('app:esb-api');
const parseString = require('xml2js').parseString;
const processServiceAction = require('../../esb-request/processServiceAction');
const middleware = require('../../middleware/index');
const sendResponse = middleware.sendResponse.defaultResponse;
const ahmCommon = require('../../ahm-common/index');
const mockResponse = require('../../app-config').mock;
module.exports = function (routeModuleDef) {
    const routeQueries = new ahmCommon.RouteQueries(routeModuleDef);
    const ahmHandler = ahmCommon.ahmHandler(routeModuleDef);
    /**
     * Return middleware and route handlers for this route module.
     * Note that order of the functions in the two arrays matters.
     * These function are loaded in order, and the functions loaded
     * first are also executed first
     */
    return {
        name: module.id,
        middleware: [
            //acceptContentTypes,
        ],
        routeHandlers: [
            validateRequest,
            middleware.esbService.callESB,
            prepareResponse,
            middleware.sendResponse.sendResponse
        ]
    };
    function validateRequest(req, res, next) {
        if (!(req.query.memberId) || _.isEqual(req.query.memberId, '')) {
            res.locals.clientResult = mockResponse;
            res.locals.searchResult = {};
            res.locals.searchResult.type = 'json';
            sendResponse(req, res, next);
        } else {
            const srvcName = 'GetMonitoredEventsForMember';
            res.locals.esbRequest = createSoapRequest(srvcName, req.query.memberId);
            next();
        }
    }

    function createSoapRequest(srvcName, memberId) {
        //GetMonitoredEventsForMember
        processServiceAction.ServiceMsg[0].header[0].service[0].name[0] = srvcName; //'GetMonitoredEventsForMember'; //srvcName;
        processServiceAction.ServiceMsg[0].payload[0].body = `<![CDATA[<GetMonitoredEventsForMemberRequest><MemberPlanID>${memberId}</MemberPlanID><SystemSource>PHR_UE</SystemSource><ProductCd>MHI</ProductCd><AllSummaryFlag>S</AllSummaryFlag></GetMonitoredEventsForMemberRequest>]]>`;
        return processServiceAction;
    }

    function prepareResponse(req, res, next) {
        const body = res.locals.esbResponse.ServiceMsg.payload.body.$value;
        parseString(body, (err, result) => {
            const GetMonitoredEventsForMemberResponse = {};
            const dataArr = [];
            _.each(result.GetMonitoredEventsForMemberResponse.MEList, (meList) => {
                const dataObj = {};
                dataObj.METrackingID = meList.METrackingID[0];
                dataObj.MEID = meList.MEID[0];
                dataObj.METitle = meList.METitle[0];
                dataObj.METypecode = meList.METypecode[0];
                dataObj.MEImpactableFlag = meList.MEImpactableFlag[0];
                if (meList.ReasonForImpactableTxt) {
                    dataObj.ReasonForImpactableTxt = meList.ReasonForImpactableTxt[0];
                }
                dataObj.MEChronic = meList.MEChronic[0];
                dataObj.MERank = meList.MERank[0];
                dataObj.MESeverity = meList.MESeverity[0];
                dataObj.MEChangeDate = meList.MEChangeDate[0];
                dataObj.CECompletionStatus = meList.CECompletionStatus[0];
                dataObj.MEExpiredFlag = meList.MEExpiredFlag[0];
                dataArr.push(dataObj);
            });
            GetMonitoredEventsForMemberResponse.MemberPlanID = result.GetMonitoredEventsForMemberResponse.MemberPlanID[0];
            GetMonitoredEventsForMemberResponse.IndexScore = result.GetMonitoredEventsForMemberResponse.IndexScore[0];
            GetMonitoredEventsForMemberResponse.ReturnCode = result.GetMonitoredEventsForMemberResponse.ReturnCode[0];
            GetMonitoredEventsForMemberResponse.MEList = dataArr;
            res.locals.clientResult = GetMonitoredEventsForMemberResponse;
        });
        next();
    }
};

