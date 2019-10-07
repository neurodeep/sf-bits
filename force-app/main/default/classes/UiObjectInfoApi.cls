/**
 * UiObjectInfoApi.
 *
 * Created by @author mmorozov on 07/15/2019.
 */

public with sharing class UiObjectInfoApi {
    public static final String OBJECT_API_NAME = 'objectApiName';
    public static final String FIELD_API_NAME = 'fieldApiName';

    /**
     * Returns a list of sObject available for lookup.
     * @param objectApiName API SObject Name
     * @param fieldApiName API Field Name
     * @return List of DTOs suitable for Lightning components.
     */
    @AuraEnabled(cacheable=true)
    public static LookupFieldResult getLookupValues(String objectApiName, String fieldApiName) {
        SObjectType objectType = getSObjectType(objectApiName, fieldApiName);
        QueryBuilder queryBuilder = getQueryBuilder(objectType, null);

        return new LookupFieldResult(
                queryBuilder.toList()
        );
    }

    /**
     * Overload to match the LWC guidelines.
     * @param fieldInfo Map of API information, e.g.,
     * {
     *  'objectApiName' => 'Case'
     *  'fieldApiName' => 'AccountId'
     * }
     * @return List of DTOs.
     */
    @AuraEnabled(cacheable=true)
    public static LookupFieldResult getLookupValues(Map<String, String> fieldInfo) {
        return getLookupValues(fieldInfo.get(OBJECT_API_NAME), fieldInfo.get(FIELD_API_NAME));
    }

    private static SObjectType getSObjectType(String objectApiName, String fieldApiName) {
        DescribeSObjectResult sObjectResult = Schema.getGlobalDescribe().get(objectApiName).getDescribe();
        DescribeFieldResult sObjectFieldResult = sObjectResult.fields.getMap().get(fieldApiName).getDescribe();

        if (sObjectFieldResult.getType() != DisplayType.REFERENCE) {
            throw new AuraHandledException('Not a lookup field: ' + sObjectFieldResult.getType());
        }

        SObjectType apiType;

        if (!sObjectFieldResult.isNamePointing()) {
            apiType = sObjectFieldResult.getReferenceTo()[0];
        } else {
            // TODO: research isNamePointing property
        }

        return apiType;
    }

    private static QueryBuilder getQueryBuilder(SObjectType objectType, String searchKey) {
        QueryBuilder queryBuilder = new QueryBuilder(objectType)
                .addField('Id')
                .addField('Name');

        if (String.isNotEmpty(searchKey)) {
            queryBuilder.addConditions()
                    .add(new QueryBuilder.LikeCondition('Name').likeAnyBoth(searchKey))
                    .endConditions();
        }

        return queryBuilder;
    }

    public class LookupFieldElement {
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String value;

        public LookupFieldElement(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    public class LookupFieldResult {
        @AuraEnabled
        public List<LookupFieldElement> values = new List<LookupFieldElement>();

        public LookupFieldResult(List<SObject> objects) {
            for (SObject o : objects) {
                this.values.add(new LookupFieldElement((String) o.get('Name'), o.Id));
            }
        }
    }
}