<?php

namespace App\Support\Security;

class EvidenceUploadRules
{
    public const MIME_TYPES = 'pdf,jpg,jpeg,png,doc,docx,xls,xlsx,ppt,pptx,txt,csv';

    public const MIMETYPES = 'application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv';

    /**
     * @return list<string>
     */
    public static function fileRules(bool $required = false): array
    {
        $rules = [
            $required ? 'required' : 'nullable',
            'file',
            'mimes:'.self::MIME_TYPES,
            'mimetypes:'.self::MIMETYPES,
            'max:10240',
        ];

        return $rules;
    }

    /**
     * @return list<string|object>
     */
    public static function httpUrlRules(bool $required = false): array
    {
        return [
            $required ? 'required' : 'nullable',
            'string',
            'url',
            'regex:/^https?:\/\//i',
            'max:2048',
        ];
    }
}
