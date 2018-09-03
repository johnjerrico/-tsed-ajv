import {
    ConverterService,
    JsonSchemesService,
    OverrideService,
    ServerSettingsService,
    ValidationService
} from "@tsed/common";
import {nameOf, Type} from "@tsed/core";
import * as Ajv from "ajv";
import {ErrorObject} from "ajv";
import {$log} from "ts-log-debug";
import {AjvValidationError} from "../errors/AjvValidationError";
import {
    AjvErrorObject,
    ErrorFormatter,
    IAjvOptions,
    IAjvSettings
} from "../interfaces/IAjvSettings";

@OverrideService(ValidationService)
export class AjvService extends ValidationService {
    private errorFormatter: ErrorFormatter;
    private options: IAjvOptions;
    constructor(
        private jsonSchemaService: JsonSchemesService,
        private serverSettingsService: ServerSettingsService,
        private converterService: ConverterService
    ){
        super();
        const ajvSettings:IAjvSettings = serverSettingsService.get("ajv") || {};
        this.options = Object.assign(
            {
                verbose: false
            },
            ajvSettings.options || {}   
        );
        this.errorFormatter = ajvSettings.errorFormat ? ajvSettings.errorFormat : this.defaultFormatter;
    }

    /**
     * @param Object
     * @param targetType
     * @param baseType
     * @returns {boolean}
     */
    public validate(obj:any, targetType:any, baseType?:any) {
        const schema = this.jsonSchemaService.getSchemaDefinition(targetType) as any;
        if (schema && !(obj === null || obj === undefined)){
            const collection = baseType ? obj : [obj];
            const options = {
                ignoreCallback: (obj: any, type: any) => type === Date,
                checkRequiredValue: false
            };
            const test = (obj:any) => {
                const ajv = new Ajv(this.options); 
                const valid = ajv.validate(schema,obj);
                if(!valid) {
                    throw this.buildErrors(ajv.errors!,targetType);
                }
            }
            
            Object.keys(collection).forEach((key:any)=>{
                test(this.converterService.deserialize(collection[key],targetType,undefined,options))
            });
        }
        return true;
    }

    /**
     * @param {ajv.ErrorObject[]} errors
     * @param {Type<any>} targetType
     * @returns {BadRequest} 
     */
    private buildErrors(errors:ErrorObject[], targetType:Type<any>) {
        $log.debug("AJV errors: ", errors);
        const message = errors.map((error:AjvErrorObject) => {
            error.modelName = nameOf(targetType);
            return this.errorFormatter.call(this,error);
        })
        .join("/n");
    }

    /**
     * @param error
     * @returns {string}
     */
    private defaultFormatter(error: AjvErrorObject) {
        let value = "";
        if (this.options.verbose) {
            value = `, value "${error.data}"`;
        }
        return `At ${error.modelName}${error.dataPath}${value} ${error.message}`;
    }
}