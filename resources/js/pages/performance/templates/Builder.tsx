import type { Option, Template } from '@/types/performance';
import TemplateEdit from './Edit';

interface Props {
    template: Template;
    departmentOptions: Option[];
    jobTitleOptions: Option[];
    objectiveScaleOptions: Option[];
    competencyScaleOptions: Option[];
    overallScaleOptions: Option[];
    perspectiveOptions: Option[];
    competencyOptions: Option[];
}

export default function TemplateBuilder(props: Props) {
    return <TemplateEdit {...props} />;
}
